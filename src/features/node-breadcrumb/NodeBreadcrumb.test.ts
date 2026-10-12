import { DOMWrapper, flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useNodeStore } from '@/stores/nodes';
import { useWorkspaceStore } from '@/stores/workspace';

import { node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import NodeBreadcrumb from './NodeBreadcrumb.vue';

describe('node breadcrumb', () => {
    const createBreadcrumb = async () => {
        setActivePinia(createPinia());
        const store = useNodeStore();
        tauri.getManuscripts.mockResolvedValue({
            status: 'ok',
            data: [
                node({ id: 'folder-a', kind: 'folder', name: 'Folder A' }),
                node({ parentId: 'folder-a' }),
                node({ id: 'entry-b', parentId: 'folder-a', name: 'Chapter B' }),
                node({ id: 'folder-b', kind: 'folder', name: 'Folder B' }),
                node({ id: 'entry-c', parentId: 'folder-b', name: 'Chapter C' }),
            ],
        });
        await store.reloadNodes();
        store.openNode(store.getNode('entry-a')!);
        const wrapper = mount(NodeBreadcrumb, { attachTo: document.body });
        return { store, wrapper, menu: new DOMWrapper(document.body) };
    };

    it('renders the opened document path and disappears after clearing the world', async () => {
        setActivePinia(createPinia());
        const store = useNodeStore();
        const wrapper = mount(NodeBreadcrumb);
        expect(wrapper.find('nav').exists()).toBe(false);
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [node()] });
        await store.reloadNodes();
        store.openNode(node());
        await nextTick();
        expect(wrapper.text()).toContain('Manuscript');
        expect(wrapper.text()).toContain('Chapter A');
        store.clearNodes();
        await nextTick();
        expect(wrapper.find('nav').exists()).toBe(false);
    });

    it('lists siblings and switches to an existing document tab', async () => {
        const { store, wrapper, menu } = await createBreadcrumb();
        store.openNode(store.getNode('entry-b')!);
        store.openNode(store.getNode('entry-a')!);
        await wrapper.get('[aria-label="Navigate from Chapter A"]').trigger('keydown', {
            key: 'Enter',
        });
        await flushPromises();
        const entries = menu.findAll('[data-slot="dropdown-menu-item"]');
        expect(entries.map((item) => item.text())).toEqual(['Chapter B']);
        await entries[0]!.trigger('click');
        await flushPromises();
        expect(store.openedNodeId).toBe('entry-b');
        expect(store.selectedNodeId).toBe('entry-b');
        expect(useWorkspaceStore().tabs).toHaveLength(2);
    });

    it('navigates through folder submenus without opening a folder tab', async () => {
        const { store, wrapper, menu } = await createBreadcrumb();
        await wrapper.get('[aria-label="Navigate from Folder A"]').trigger('keydown', {
            key: 'Enter',
        });
        await flushPromises();
        const folder = menu
            .findAll('[data-slot="dropdown-menu-sub-trigger"]')
            .find((item) => item.text() === 'Folder B')!;
        await folder.trigger('click');
        await flushPromises();
        expect(store.openedNodeId).toBe('entry-a');
        await menu.get('[data-slot="dropdown-menu-item"]').trigger('click');
        await flushPromises();
        expect(store.openedNodeId).toBe('entry-c');
        expect(useWorkspaceStore().tabs.map((tab) => tab.nodeId)).toEqual(['entry-a', 'entry-c']);
    });
});
