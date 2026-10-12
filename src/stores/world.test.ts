import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { deferred, manifest, node } from '../../tests/support/fixtures';
import { tauri } from '../../tests/unit/tauri';
import { useNodeStore } from './nodes';
import { useWorkspaceStore } from './workspace';
import { useWorldStore } from './world';

describe('world store', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('loads the initial world and responds to dirty events', async () => {
        tauri.getWorld.mockResolvedValue({ status: 'ok', data: manifest() });
        const store = useWorldStore();
        await store.initWorld();
        await flushPromises();
        expect(store.hasWorld).toBe(true);
        expect(store.worldName).toBe('world-a');
        tauri.listen.mock.calls[0]?.[0]({ payload: true });
        expect(store.isDirty).toBe(true);
        store.clearManifest();
        await flushPromises();
        expect(store.isDirty).toBe(false);
        expect(store.worldName).toBeNull();
    });

    it('reloads nodes and clears the open document when switching between worlds', async () => {
        const store = useWorldStore();
        store.setManifest(manifest());
        await flushPromises();
        useNodeStore().openNode(node());
        tauri.getManuscripts.mockResolvedValue({
            status: 'ok',
            data: [node({ id: 'world-b-entry' })],
        });
        store.setManifest(manifest('world-b'));
        await flushPromises();
        expect(tauri.getManuscripts).toHaveBeenCalledTimes(2);
        expect(useNodeStore().openedNodeId).toBeNull();
        expect(useNodeStore().manuscripts[0]?.id).toBe('world-b-entry');
    });

    it('shares initialization across concurrent callers', async () => {
        const listening = deferred<() => void>();
        tauri.listen.mockReturnValue(listening.promise);
        const store = useWorldStore();
        const first = store.initWorld();
        const second = store.initWorld();
        listening.resolve(tauri.unlisten);
        await Promise.all([first, second]);
        await store.initWorld();
        expect(tauri.listen).toHaveBeenCalledTimes(1);
        expect(tauri.getWorld).toHaveBeenCalledTimes(1);
    });

    it('restores tab order, active document and activation history in a new webview session', async () => {
        tauri.getWorld.mockResolvedValue({ status: 'ok', data: manifest() });
        tauri.getManuscripts.mockResolvedValue({
            status: 'ok',
            data: [node(), node({ id: 'entry-b' }), node({ id: 'entry-c' })],
        });
        const world = useWorldStore();
        await world.initWorld();
        await world.waitForNodes();
        const workspace = useWorkspaceStore();
        workspace.openDocument('entry-a');
        workspace.openDocument('entry-b');
        workspace.openDocument('entry-c');
        workspace.activeTab = 'node:entry-a';
        world.$dispose();
        useNodeStore().$dispose();
        workspace.$dispose();
        sessionStorage.clear();

        setActivePinia(createPinia());
        const restoredWorld = useWorldStore();
        await restoredWorld.initWorld();
        await restoredWorld.waitForNodes();
        const restored = useWorkspaceStore();
        expect(restored.tabs.map((tab) => tab.nodeId)).toEqual(['entry-a', 'entry-b', 'entry-c']);
        expect(restored.activeDocumentId).toBe('entry-a');
        expect(useNodeStore().selectedNodeId).toBe('entry-a');
        restored.closeTab('node:entry-a');
        expect(restored.activeDocumentId).toBe('entry-c');
    });

    it('can retry initialization after a listener failure', async () => {
        tauri.listen.mockRejectedValueOnce(new Error('Listener unavailable'));
        const store = useWorldStore();
        await expect(store.initWorld()).rejects.toThrow('Listener unavailable');
        await store.initWorld();
        expect(tauri.listen).toHaveBeenCalledTimes(2);
    });
});
