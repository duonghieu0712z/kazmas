import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { deferred, node } from '../../tests/unit/fixtures';
import { tauri } from '../../tests/unit/tauri';
import { useNodeStore } from './nodes';

describe('node store', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('builds nested trees and breadcrumbs from unordered nodes', async () => {
        const child = node({ parentId: 'folder' });
        const folder = node({ id: 'folder', kind: 'folder', name: 'Folder' });
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [child, folder] });
        const store = useNodeStore();
        await store.reloadNodes();
        expect(store.manuscripts).toHaveLength(1);
        expect(store.manuscripts[0]?.children[0]?.id).toBe(child.id);
        store.openNode(child);
        expect(store.openedNodePath.map((item) => item.name)).toEqual([
            'Manuscript',
            'Folder',
            'Chapter A',
        ]);
    });

    it('keeps orphan nodes accessible and does not open folders', async () => {
        const orphan = node({ parentId: 'missing' });
        tauri.getWikis.mockResolvedValue({ status: 'ok', data: [orphan] });
        const store = useNodeStore();
        await store.reloadNodes();
        expect(store.wikis[0]?.id).toBe(orphan.id);
        store.selectNode(orphan);
        store.openNode(node({ id: 'folder', kind: 'folder' }));
        expect(store.selectedNodeId).toBe(orphan.id);
        expect(store.openedNodeId).toBeNull();
    });

    it('clears selection and rejects late results after closing a world', async () => {
        const result = deferred<{ status: 'ok'; data: ReturnType<typeof node>[] }>();
        tauri.getManuscripts.mockReturnValue(result.promise);
        const store = useNodeStore();
        store.openNode(node());
        const loading = store.reloadNodes();
        store.clearNodes();
        result.resolve({ status: 'ok', data: [node()] });
        await loading;
        expect(store.manuscripts).toEqual([]);
        expect(store.openedNodeId).toBeNull();
        expect(store.openedNodePath).toEqual([]);
    });

    it('uses the newest reload when earlier requests complete later', async () => {
        const first = deferred<{ status: 'ok'; data: ReturnType<typeof node>[] }>();
        tauri.getManuscripts
            .mockReturnValueOnce(first.promise)
            .mockResolvedValueOnce({ status: 'ok', data: [node({ id: 'new' })] });
        const store = useNodeStore();
        const old = store.reloadNodes();
        await store.reloadNodes();
        first.resolve({ status: 'ok', data: [node({ id: 'old' })] });
        await old;
        expect(store.manuscripts[0]?.id).toBe('new');
    });

    it('handles empty and failed command responses', async () => {
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: null });
        tauri.getWikis.mockResolvedValue({ status: 'error', error: { code: 'SQLITE' } });
        const store = useNodeStore();
        await store.reloadNodes();
        expect(store.manuscripts).toEqual([]);
        expect(store.wikis).toEqual([]);
    });

    it('does not loop when a breadcrumb encounters cyclic parents', async () => {
        tauri.getManuscripts.mockResolvedValue({
            status: 'ok',
            data: [node({ parentId: 'entry-a' })],
        });
        const store = useNodeStore();
        await store.reloadNodes();
        store.openNode(node());
        expect(store.openedNodePath).toEqual([]);
    });
});
