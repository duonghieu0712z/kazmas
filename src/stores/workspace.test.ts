import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { node } from '../../tests/support/fixtures';
import { useNodeStore } from './nodes';
import { useWorkspaceStore } from './workspace';

describe('workspace tabs', () => {
    beforeEach(() => setActivePinia(createPinia()));

    it('opens documents once and reselects an existing tab', () => {
        const nodes = useNodeStore();
        const workspace = useWorkspaceStore();
        nodes.openNode(node());
        nodes.openNode(node({ id: 'entry-b' }));
        nodes.openNode(node());

        expect(workspace.tabs.map((tab) => tab.nodeId)).toEqual(['entry-a', 'entry-b']);
        expect(workspace.activeDocumentId).toBe('entry-a');
    });

    it('keeps the node store synchronized with tab selection and closing', () => {
        const nodes = useNodeStore();
        const workspace = useWorkspaceStore();
        nodes.openNode(node());
        nodes.openNode(node({ id: 'entry-b' }));
        workspace.activeTab = 'node:entry-a';

        expect(nodes.openedNodeId).toBe('entry-a');
        expect(nodes.selectedNodeId).toBe('entry-a');
        workspace.closeTab('node:entry-a');
        expect(nodes.openedNodeId).toBe('entry-b');
        workspace.closeTab('node:entry-b');
        expect(nodes.openedNodeId).toBeNull();

        nodes.openNode(node({ id: 'entry-b' }));
        expect(workspace.activeDocumentId).toBe('entry-b');
        expect(workspace.tabs).toHaveLength(1);
    });

    it('returns to the most recently selected remaining tab instead of its neighbor', () => {
        const workspace = useWorkspaceStore();
        for (const id of ['a', 'b', 'c', 'd']) {
            workspace.openDocument(id);
        }
        workspace.activeTab = 'node:a';
        workspace.activeTab = 'node:c';
        workspace.closeTab('node:c');

        expect(workspace.activeDocumentId).toBe('a');
        workspace.closeTab('node:d');
        expect(workspace.activeDocumentId).toBe('a');
        workspace.closeTab('node:a');
        expect(workspace.activeDocumentId).toBe('b');
    });

    it('clears tabs and activation history when node data is reset', () => {
        const workspace = useWorkspaceStore();
        workspace.openDocument('old');
        useNodeStore().clearNodes();

        expect(workspace.tabs).toEqual([]);
        expect(workspace.activeTab).toBe('');
        workspace.openDocument('new');
        workspace.closeTab('node:new');
        expect(workspace.activeDocumentId).toBeNull();
    });

    it('keeps separate tab sessions when worlds are closed or switched', () => {
        const workspace = useWorkspaceStore();
        workspace.restoreWorld('world-a', () => true);
        workspace.openDocument('a');
        workspace.openDocument('b');
        workspace.closeTab('node:b');
        workspace.resetWorld();
        workspace.restoreWorld('world-b', () => true);
        expect(workspace.tabs).toEqual([]);
        workspace.openDocument('c');
        workspace.resetWorld();
        workspace.restoreWorld('world-a', () => true);
        expect(workspace.tabs.map((tab) => tab.nodeId)).toEqual(['a']);
        expect(workspace.activeDocumentId).toBe('a');
        workspace.resetWorld();
        workspace.restoreWorld('world-b', () => true);
        expect(workspace.activeDocumentId).toBe('c');
    });

    it('skips documents that no longer exist and falls back when the active tab is missing', () => {
        const workspace = useWorkspaceStore();
        workspace.restoreWorld('world-a', () => true);
        workspace.openDocument('a');
        workspace.openDocument('b');
        workspace.resetWorld();
        workspace.restoreWorld('world-a', (id) => id === 'a');
        expect(workspace.tabs.map((tab) => tab.nodeId)).toEqual(['a']);
        expect(workspace.activeDocumentId).toBe('a');
        workspace.closeTab('node:a');
        workspace.resetWorld();
        workspace.restoreWorld('world-a', () => true);
        expect(workspace.tabs).toEqual([]);
        expect(workspace.activeDocumentId).toBeNull();
    });
});
