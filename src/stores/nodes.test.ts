import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { deferred, node } from '../../tests/support/fixtures';
import { tauri } from '../../tests/unit/tauri';
import { useNodeStore } from './nodes';

describe('node store', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('identifies empty trashed folders by their original section and parent path', async () => {
        const wiki = node({ id: 'wiki', kind: 'wiki', name: 'Wiki' });
        const manuscript = node({ id: 'manuscript', kind: 'manuscript', name: 'Manuscript' });
        const parent = node({
            id: 'characters',
            parentId: wiki.id,
            kind: 'folder',
            name: 'Characters',
        });
        const wikiFolder = node({
            id: 'empty-wiki',
            parentId: parent.id,
            kind: 'folder',
            name: 'Unused',
        });
        const manuscriptFolder = node({
            id: 'empty-manuscript',
            parentId: manuscript.id,
            kind: 'folder',
            name: 'Draft',
        });
        tauri.getTrash.mockResolvedValue({ status: 'ok', data: [wikiFolder, manuscriptFolder] });
        tauri.getNode.mockImplementation(async (id: string) => ({
            status: 'ok',
            data: [wiki, manuscript, parent].find((item) => item.id === id) ?? null,
        }));
        const store = useNodeStore();
        await store.loadTrash();
        expect(store.trashLocations.get(wikiFolder.id)).toEqual({
            section: 'Wiki',
            path: 'Wiki / Characters',
        });
        expect(store.trashLocations.get(manuscriptFolder.id)).toEqual({
            section: 'Manuscript',
            path: 'Manuscript',
        });
    });

    it('rejects late trash ancestor loads after closing a world', async () => {
        const parent = deferred<{ status: 'ok'; data: ReturnType<typeof node> }>();
        tauri.getTrash.mockResolvedValue({
            status: 'ok',
            data: [node({ parentId: 'manuscript' })],
        });
        tauri.getNode.mockReturnValue(parent.promise);
        const store = useNodeStore();
        const pending = store.loadTrash();
        await Promise.resolve();
        store.clearNodes();
        parent.resolve({ status: 'ok', data: node({ id: 'manuscript', kind: 'manuscript' }) });
        await pending;
        expect(store.trashNodes).toEqual([]);
        expect(store.trashLocations.size).toBe(0);
    });

    it('rejects late trash loads after closing a world', async () => {
        const result = deferred<{ status: 'ok'; data: ReturnType<typeof node>[] }>();
        tauri.getTrash.mockReturnValue(result.promise);
        const store = useNodeStore();
        const pending = store.loadTrash();
        store.clearNodes();
        result.resolve({ status: 'ok', data: [node({ deletedAt: '2026-01-01T00:00:00Z' })] });
        await pending;
        expect(store.trashNodes).toEqual([]);
    });

    it('reports trash load failures and clears the error after retry', async () => {
        tauri.getTrash.mockRejectedValueOnce(new Error('Read failed'));
        const store = useNodeStore();
        expect(await store.loadTrash()).toBe(false);
        expect(store.trashError).toContain('could not be loaded');
        tauri.getTrash.mockResolvedValue({ status: 'ok', data: [node()] });
        await store.loadTrash();
        expect(store.trashNodes).toHaveLength(1);
        expect(store.trashError).toBe('');
    });

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
