import type { NodeDto } from '@/generated/bindings';

import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import { deferred, manifest, node } from '../../tests/unit/fixtures';
import { tauri } from '../../tests/unit/tauri';

import './desktop';

vi.mock('@/actions/world', () => ({ closeWorld: vi.fn() }));
vi.mock('@/menus', () => ({ executeMenuCommand: vi.fn() }));

describe('desktop bridge world loading', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it.each(['create', 'open'] as const)(
        '%s waits for the watcher reload without starting a second reload',
        async (action) => {
            const world = useWorldStore();
            world.setManifest(manifest('previous'));
            await flushPromises();
            const nodes = useNodeStore();
            nodes.openNode(node());
            const manuscripts = deferred<{ status: 'ok'; data: NodeDto[] }>();
            const wikis = deferred<{ status: 'ok'; data: NodeDto[] }>();
            tauri.getManuscripts.mockClear().mockReturnValue(manuscripts.promise);
            tauri.getWikis.mockClear().mockReturnValue(wikis.promise);
            tauri.createWorld.mockResolvedValue({ status: 'ok', data: manifest() });
            tauri.openWorld.mockResolvedValue({ status: 'ok', data: manifest() });
            const bridge = window.__kazmasDesktopTest;
            const pending =
                action === 'create' ? bridge.create('World', '/test') : bridge.open('/test.kazmas');
            let completed = false;
            void pending.then(() => {
                completed = true;
            });
            await flushPromises();
            expect(tauri.getManuscripts).toHaveBeenCalledTimes(1);
            expect(tauri.getWikis).toHaveBeenCalledTimes(1);
            expect(nodes.openedNodeId).toBeNull();
            expect(completed).toBe(false);
            manuscripts.resolve({ status: 'ok', data: [node()] });
            await flushPromises();
            expect(completed).toBe(false);
            wikis.resolve({ status: 'ok', data: [node({ id: 'wiki-a', kind: 'wiki_entry' })] });
            await pending;
            expect(nodes.manuscripts[0]?.id).toBe('entry-a');
            expect(nodes.wikis[0]?.id).toBe('wiki-a');
            expect(completed).toBe(true);
        },
    );
});
