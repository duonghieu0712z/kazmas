import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { effectScope } from 'vue';

import { useWorldStore } from '@/stores/world';

import { deferred, manifest, node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import { useRenameNode } from './use-rename-node';

async function setupRename() {
    setActivePinia(createPinia());
    tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [node()] });
    const world = useWorldStore();
    world.setManifest(manifest());
    await flushPromises();
    const scope = effectScope();
    const actions = scope.run(useRenameNode)!;
    actions.start('entry-a');
    return { ...actions, scope, world };
}

describe('inline rename', () => {
    it('deduplicates Enter and blur and tracks the mutation through the tree refresh', async () => {
        const actions = await setupRename();
        try {
            const mutation = deferred<{ status: 'ok'; data: boolean }>();
            const refresh = deferred<{ status: 'ok'; data: ReturnType<typeof node>[] }>();
            tauri.updateNode.mockReturnValue(mutation.promise);
            tauri.getManuscripts.mockReturnValue(refresh.promise);
            actions.rename.value!.name = '  Revised  ';
            const first = actions.submit();
            await actions.submit();
            actions.cancel();
            expect(actions.rename.value?.saving).toBe(true);
            expect(tauri.updateNode).toHaveBeenCalledExactlyOnceWith({
                id: 'entry-a',
                parentId: null,
                name: 'Revised',
            });
            let finished = false;
            const waiting = actions.world.waitForCreations().then(() => {
                finished = true;
            });
            mutation.resolve({ status: 'ok', data: true });
            await flushPromises();
            expect(finished).toBe(false);
            refresh.resolve({ status: 'ok', data: [node({ name: 'Revised' })] });
            await first;
            await waiting;
            expect(actions.rename.value).toBeNull();
            expect(actions.world.isDirty).toBe(true);
        } finally {
            actions.scope.stop();
        }
    });

    it('ignores a pending result after leaving and returning to the same world', async () => {
        const actions = await setupRename();
        try {
            const pending = deferred<{ status: 'ok'; data: boolean }>();
            tauri.updateNode.mockReturnValue(pending.promise);
            actions.rename.value!.name = 'Old rename';
            const saving = actions.submit();
            actions.world.setManifest(manifest('other-world'));
            actions.world.setManifest(manifest());
            pending.resolve({ status: 'ok', data: true });
            await saving;
            expect(actions.rename.value).toBeNull();
            expect(actions.world.isDirty).toBe(false);
        } finally {
            actions.scope.stop();
        }
    });
});
