import type { NodeTreeDto } from '@/stores/nodes';

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import { manifest, node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import NodeTreeSidebar from './NodeTreeSidebar.vue';

function mountTree(tree: NodeTreeDto[]) {
    return mount(TooltipProvider, {
        slots: { default: () => h(NodeTreeSidebar, { tree, section: 'Manuscript', active: true }) },
        global: {
            stubs: {
                SidebarContent: { template: '<div><slot /></div>' },
                ScrollArea: { template: '<div><slot /></div>' },
            },
        },
    });
}

describe('node tree interactions', () => {
    it('restores filtering, selection and both expansion states after remounting a world', async () => {
        setActivePinia(createPinia());

        const world = useWorldStore();
        world.setManifest(manifest());
        await flushPromises();

        const tree: NodeTreeDto[] = [
            {
                ...node({ id: 'open-folder', kind: 'folder', name: 'Draft' }),
                children: [{ ...node({ name: 'Chapter A' }), children: [] }],
            },
            {
                ...node({ id: 'closed-folder', kind: 'folder', name: 'Archive' }),
                children: [{ ...node({ id: 'entry-b', name: 'Chapter B' }), children: [] }],
            },
        ];
        const first = mountTree(tree);

        await first.findAll('.tree-chevron-icon')[0]!.trigger('click');
        await first.findAll('[role="treeitem"]')[1]!.trigger('click');
        await first.get('input').setValue('Chapter A');
        await first.get('[aria-label="Collapse all"]').trigger('click');
        await flushPromises();
        first.unmount();

        setActivePinia(createPinia());
        useWorldStore().setManifest(manifest());
        await flushPromises();

        const restored = mountTree(structuredClone(tree));
        expect(restored.get('input').element.value).toBe('Chapter A');
        expect(restored.findAll('[role="treeitem"]')).toHaveLength(1);

        await restored.get('[aria-label="Clear filter"]').trigger('click');
        const items = restored.findAll('[role="treeitem"]');
        expect(items).toHaveLength(3);
        expect(items[0]!.attributes('aria-expanded')).toBe('true');
        expect(items[1]!.attributes('aria-selected')).toBe('true');
        expect(items[2]!.attributes('aria-expanded')).toBe('false');

        useWorldStore().setManifest(manifest('other-world'));
        await flushPromises();
        expect(restored.get('input').element.value).toBe('');
        expect(restored.findAll('[role="treeitem"]')).toHaveLength(2);
        expect(restored.find('[aria-selected="true"]').exists()).toBe(false);
    });

    it('expands and collapses every level while keeping filtered expansion separate', async () => {
        setActivePinia(createPinia());

        const wrapper = mountTree([
            {
                ...node({ id: 'folder', kind: 'folder', name: 'Draft' }),
                children: [
                    {
                        ...node({ id: 'nested-folder', kind: 'folder', name: 'Part' }),
                        children: [{ ...node({ name: 'Chapter A' }), children: [] }],
                    },
                ],
            },
        ]);

        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);

        await wrapper.get('[aria-label="Expand all"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3);

        await wrapper.get('[aria-label="Collapse all"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);

        await wrapper.get('[aria-label="Expand all"]').trigger('click');
        await wrapper.get('input').setValue('Chapter');
        await wrapper.get('[aria-label="Collapse all"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);

        await wrapper.get('[aria-label="Expand all"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3);

        await wrapper.get('[aria-label="Collapse all"]').trigger('click');
        await wrapper.get('[aria-label="Clear filter"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3);
    });

    it('reveals matching descendants with their ancestors and restores expansion after filtering', async () => {
        setActivePinia(createPinia());

        const wrapper = mountTree([
            {
                ...node({ id: 'folder', kind: 'folder', name: 'Draft' }),
                children: [
                    { ...node({ name: 'Chapter A' }), children: [] },
                    { ...node({ id: 'entry-b', name: 'Chapter B' }), children: [] },
                ],
            },
        ]);

        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);

        await wrapper.get('input').setValue(' chapter b ');
        expect(wrapper.findAll('[role="treeitem"]').map((item) => item.text())).toEqual([
            'Draft',
            'Chapter B',
        ]);

        await wrapper.get('[aria-label="Clear filter"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);

        await wrapper.get('.tree-chevron-icon').trigger('click');
        await wrapper.get('input').setValue('missing');
        expect(wrapper.get('[role="status"]').text()).toBe('No matching items.');

        await wrapper.get('input').trigger('keydown', { key: 'Escape' });
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3);
    });

    it.each(['Manuscript', 'Wiki'] as const)(
        'creates and opens an entry in %s',
        async (section) => {
            setActivePinia(createPinia());

            useWorldStore().setManifest(manifest());
            await flushPromises();

            const entry = node({
                id: 'new-entry',
                kind: section === 'Wiki' ? 'wiki_entry' : 'manuscript_entry',
            });
            const create = section === 'Wiki' ? tauri.createWikiEntry : tauri.createManuscriptEntry;
            const load = section === 'Wiki' ? tauri.getWikis : tauri.getManuscripts;
            create.mockResolvedValue({ status: 'ok', data: entry.id });
            load.mockResolvedValue({ status: 'ok', data: [entry] });

            const host = defineComponent({
                setup: () => {
                    const nodes = useNodeStore();

                    return () =>
                        h(NodeTreeSidebar, {
                            active: true,
                            section,
                            tree: section === 'Wiki' ? nodes.wikis : nodes.manuscripts,
                        });
                },
            });

            const wrapper = mount(TooltipProvider, { slots: { default: host } });

            await wrapper.get('input').setValue('missing');
            await wrapper.get(`[aria-label="New ${section.toLowerCase()} entry"]`).trigger('click');
            await flushPromises();

            expect(create).toHaveBeenCalledExactlyOnceWith(null, null);
            expect(useNodeStore().openedNodeId).toBe(entry.id);
            expect(wrapper.get('input').element.value).toBe('');
            expect(wrapper.get('[role="treeitem"]').attributes('aria-selected')).toBe('true');
            expect(useWorldStore().isDirty).toBe(true);
        },
    );

    it.each(['Manuscript', 'Wiki'] as const)(
        'creates a folder in an empty %s tree without opening a document',
        async (section) => {
            setActivePinia(createPinia());

            useWorldStore().setManifest(manifest());
            await flushPromises();

            const nodes = useNodeStore();
            nodes.openNode(node());

            const folder = node({ id: 'new-folder', kind: 'folder', name: 'Untitled' });
            tauri.createFolder.mockResolvedValue({ status: 'ok', data: folder.id });
            const load = section === 'Wiki' ? tauri.getWikis : tauri.getManuscripts;
            load.mockResolvedValue({ status: 'ok', data: [folder] });

            const host = defineComponent({
                setup: () => () =>
                    h(NodeTreeSidebar, {
                        active: true,
                        section,
                        tree: section === 'Wiki' ? nodes.wikis : nodes.manuscripts,
                    }),
            });
            const wrapper = mount(TooltipProvider, { slots: { default: host } });

            await wrapper.get('[aria-label="New folder"]').trigger('click');
            await flushPromises();

            expect(tauri.createFolder).toHaveBeenCalledExactlyOnceWith(
                null,
                null,
                section.toLowerCase(),
            );
            expect(nodes.selectedNodeId).toBe(folder.id);
            expect(nodes.openedNodeId).toBe('entry-a');
            expect(wrapper.get('[role="treeitem"]').text()).toBe('Untitled');
            expect(useWorldStore().isDirty).toBe(true);
        },
    );

    it('shows a failed creation without changing the opened document', async () => {
        setActivePinia(createPinia());

        useWorldStore().setManifest(manifest());
        await flushPromises();

        useNodeStore().openNode(node());
        tauri.createManuscriptEntry.mockResolvedValue({ status: 'error', error: { code: 'IO' } });

        const wrapper = mountTree([]);

        await wrapper.get('[aria-label="New manuscript entry"]').trigger('click');
        await flushPromises();

        expect(wrapper.get('[role="alert"]').text()).toBe('Entry could not be created.');
        expect(useNodeStore().openedNodeId).toBe('entry-a');
    });

    it('selects a folder without opening it and opens an entry after expanding', async () => {
        setActivePinia(createPinia());

        const child = { ...node(), children: [] };
        const folder = {
            ...node({ id: 'folder', kind: 'folder', name: 'Folder' }),
            children: [child],
        };

        const wrapper = mountTree([folder]);

        await wrapper.get('[role="treeitem"]').trigger('click');
        expect(useNodeStore().selectedNodeId).toBe('folder');
        expect(useNodeStore().openedNodeId).toBeNull();

        await wrapper.get('.tree-chevron-icon').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2);

        await wrapper.findAll('[role="treeitem"]')[1]!.trigger('click');
        expect(useNodeStore().openedNodeId).toBe('entry-a');
    });
});
