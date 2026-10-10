import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import { deferred, manifest, node } from '../../tests/support/fixtures';
import { tauri } from '../../tests/unit/tauri';
import { useTrashActions } from './trash';

const { confirm } = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock('@/providers/dialog', () => ({
    AlertDialogButtons: { OkCancel: 'ok-cancel' },
    AlertDialogKind: { Warning: 'warning', Error: 'error' },
    AlertDialogResult: { Ok: 'ok' },
    openAlertDialog: confirm,
}));

describe('trash actions', () => {
    beforeEach(async () => {
        setActivePinia(createPinia());
        confirm.mockReset().mockResolvedValue('ok');
        tauri.getTrash.mockResolvedValue({
            status: 'ok',
            data: [node({ deletedAt: '2026-01-01T00:00:00Z' })],
        });
        const world = useWorldStore();
        world.setManifest(manifest());
        await world.waitForNodes();
    });

    it('restores an item and refreshes the tree and trash', async () => {
        tauri.getTrash.mockResolvedValue({ status: 'ok', data: [] });
        await useTrashActions().restore('entry-a');
        expect(tauri.restoreNode).toHaveBeenCalledWith('entry-a');
        expect(useWorldStore().isDirty).toBe(true);
        expect(useNodeStore().trashNodes).toEqual([]);
        expect(confirm).not.toHaveBeenCalled();
    });

    it('preserves trash when permanent deletion is cancelled', async () => {
        confirm.mockResolvedValue('cancel');
        await useTrashActions().purge('entry-a');
        expect(tauri.purgeNode).not.toHaveBeenCalled();
        expect(useNodeStore().trashNodes).toHaveLength(1);
        expect(useWorldStore().isDirty).toBe(false);
    });

    it('restores all trash without a deletion confirmation', async () => {
        tauri.getTrash.mockResolvedValue({ status: 'ok', data: [] });
        await useTrashActions().restoreAll();
        expect(tauri.restoreTrash).toHaveBeenCalledOnce();
        expect(confirm).not.toHaveBeenCalled();
        expect(useNodeStore().trashNodes).toEqual([]);
        expect(useWorldStore().isDirty).toBe(true);
    });

    it('empties trash only after confirmation', async () => {
        tauri.getTrash.mockResolvedValue({ status: 'ok', data: [] });
        await useTrashActions().empty();
        expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Empty Trash' }));
        expect(tauri.emptyTrash).toHaveBeenCalledOnce();
        expect(useNodeStore().trashNodes).toEqual([]);
    });

    it('does not delete from a different world after confirmation', async () => {
        const result = deferred<string>();
        confirm.mockReturnValue(result.promise);
        const pending = useTrashActions().purge('entry-a');
        useWorldStore().setManifest(manifest('other-world'));
        result.resolve('ok');
        await pending;
        expect(tauri.purgeNode).not.toHaveBeenCalled();
    });

    it('rejects duplicate operations while a restore is pending', async () => {
        const result = deferred<{ status: 'ok'; data: boolean }>();
        tauri.restoreNode.mockReturnValue(result.promise);
        const actions = useTrashActions();
        const pending = actions.restore('entry-a');
        await nextTick();
        await actions.restore('entry-a');
        result.resolve({ status: 'ok', data: true });
        await pending;
        expect(tauri.restoreNode).toHaveBeenCalledOnce();
        expect(actions.busy).toBe(false);
    });

    it('reports command failures and keeps the item available for retry', async () => {
        tauri.restoreNode.mockResolvedValue({ status: 'error', error: { code: 'SQLITE' } });
        await useTrashActions().restore('entry-a');
        expect(useTrashActions().error).toContain('could not be completed');
        expect(useNodeStore().trashNodes).toHaveLength(1);
        expect(useWorldStore().isDirty).toBe(false);
        expect(useTrashActions().busy).toBe(false);
    });
});
