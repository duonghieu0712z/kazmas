import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import { useNodeStore } from '@/stores/nodes';

import { node } from '../../../tests/support/fixtures';
import NodeTreeView from './NodeTreeView.vue';

describe('node tree interactions', () => {
    it('selects a folder without opening it and opens an entry after expanding', async () => {
        setActivePinia(createPinia());
        const child = { ...node(), children: [] };
        const folder = {
            ...node({ id: 'folder', kind: 'folder', name: 'Folder' }),
            children: [child],
        };
        const wrapper = mount(NodeTreeView, {
            props: { tree: [folder] },
            global: {
                stubs: {
                    SidebarContent: { template: '<div><slot /></div>' },
                    ScrollArea: { template: '<div><slot /></div>' },
                },
            },
        });
        await wrapper.get('[role="treeitem"]').trigger('click');
        expect(useNodeStore().selectedNodeId).toBe('folder');
        expect(useNodeStore().openedNodeId).toBeNull();
        await wrapper.get('.tree-chevron-icon').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2);
        await wrapper.findAll('[role="treeitem"]')[1]!.trigger('click');
        expect(useNodeStore().openedNodeId).toBe('entry-a');
    });
});
