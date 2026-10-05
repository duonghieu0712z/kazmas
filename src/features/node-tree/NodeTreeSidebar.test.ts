import type { NodeDto } from '@/generated/bindings';
import type { NodeTreeDto } from '@/stores/nodes';

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import { deferred, manifest, node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import NodeTreeSidebar from './NodeTreeSidebar.vue';

async function submitName(wrapper: ReturnType<typeof mount>, name = '') {
    await wrapper.get('[aria-label="New item name"]').setValue(name);
    await wrapper.get('[aria-label="New item name"]').trigger('keydown', { key: 'Enter' });
    await flushPromises();
}

function mountTree(tree: NodeTreeDto[]) {
    return mount(TooltipProvider, {
        attachTo: document.body,
        slots: { default: () => h(NodeTreeSidebar, { tree, section: 'Manuscript', active: true }) },
        global: {
            stubs: {
                SidebarContent: { template: '<div><slot /></div>' },
                ScrollArea: { template: '<div><slot /></div>' },
            },
        },
    });
}

async function mountStoredTree(data: NodeDto[] = []) {
    setActivePinia(createPinia());
    const nodes = useNodeStore();
    const world = useWorldStore();
    tauri.getManuscripts.mockResolvedValue({ status: 'ok', data });
    world.setManifest(manifest());
    await flushPromises();
    const host = defineComponent({
        setup: () => () =>
            h(NodeTreeSidebar, {
                active: true,
                section: 'Manuscript',
                tree: nodes.manuscripts,
            }),
    });
    const wrapper = mount(TooltipProvider, { attachTo: document.body, slots: { default: host } });
    return { wrapper, nodes, world };
}

describe('node tree interactions', () => {
    it('restores filtering, selection and both expansion states after remounting a world', async () => {
        vi.useFakeTimers();
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
        await vi.advanceTimersByTimeAsync(150);
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
        vi.useFakeTimers();
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
        await vi.advanceTimersByTimeAsync(150);
        await wrapper.get('[aria-label="Collapse all"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);

        await wrapper.get('[aria-label="Expand all"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3);

        await wrapper.get('[aria-label="Collapse all"]').trigger('click');
        await wrapper.get('[aria-label="Clear filter"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3);
    });

    it('reveals matching descendants with their ancestors and restores expansion after filtering', async () => {
        vi.useFakeTimers();
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
        await vi.advanceTimersByTimeAsync(150);
        expect(wrapper.findAll('[role="treeitem"]').map((item) => item.text())).toEqual([
            'Draft',
            'Chapter B',
        ]);

        await wrapper.get('[aria-label="Clear filter"]').trigger('click');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);

        await wrapper.get('.tree-chevron-icon').trigger('click');
        await wrapper.get('input').setValue('missing');
        await vi.advanceTimersByTimeAsync(150);
        expect(wrapper.get('[role="status"]').text()).toBe('No matching items.');

        await wrapper.get('input').trigger('keydown', { key: 'Escape' });
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(3);
    });

    it('updates the input immediately and filters only after typing stops for 150 ms', async () => {
        vi.useFakeTimers();
        setActivePinia(createPinia());
        const wrapper = mountTree([
            { ...node({ name: 'Chapter A' }), children: [] },
            { ...node({ id: 'entry-b', name: 'Chapter B' }), children: [] },
        ]);
        const input = wrapper.get<HTMLInputElement>('input');
        await input.setValue('Chapter A');
        expect(input.element.value).toBe('Chapter A');
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2);
        await vi.advanceTimersByTimeAsync(100);
        await input.setValue('Chapter B');
        await vi.advanceTimersByTimeAsync(149);
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(wrapper.findAll('[role="treeitem"]').map((item) => item.text())).toEqual([
            'Chapter B',
        ]);
    });

    it('clears immediately and cancels a pending filter on Escape or world changes', async () => {
        vi.useFakeTimers();
        setActivePinia(createPinia());
        const world = useWorldStore();
        world.setManifest(manifest());
        await flushPromises();
        const wrapper = mountTree([{ ...node(), children: [] }]);
        const input = wrapper.get<HTMLInputElement>('input');
        await input.setValue('missing');
        await vi.advanceTimersByTimeAsync(150);
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(0);
        await input.setValue('Chapter');
        await input.trigger('keydown', { key: 'Escape' });
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(150);
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);
        await input.setValue('missing');
        world.setManifest(manifest('other-world'));
        await flushPromises();
        expect(input.element.value).toBe('');
        await vi.advanceTimersByTimeAsync(150);
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(1);
        expect(wrapper.find('[role="status"]').exists()).toBe(false);
        world.setManifest(manifest());
        await flushPromises();
        expect(input.element.value).toBe('missing');
        await vi.advanceTimersByTimeAsync(150);
        expect(wrapper.get('[role="status"]').text()).toBe('No matching items.');
    });

    it('cancels a pending filter when starting inline node creation', async () => {
        vi.useFakeTimers();
        const { wrapper } = await mountStoredTree([node()]);
        await wrapper.get('[aria-label="Filter manuscript"]').setValue('missing');
        await wrapper.get('[aria-label="New folder"]').trigger('click');
        expect(
            wrapper.get<HTMLInputElement>('[aria-label="Filter manuscript"]').element.value,
        ).toBe('');
        await vi.advanceTimersByTimeAsync(150);
        expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2);
        expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(true);
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
            expect(create).not.toHaveBeenCalled();
            await submitName(wrapper, '  New entry  ');

            expect(create).toHaveBeenCalledExactlyOnceWith('New entry', null);
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
            await submitName(wrapper, '   ');

            expect(tauri.createFolder).toHaveBeenCalledExactlyOnceWith(
                'Untitled',
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
        await submitName(wrapper);

        expect(wrapper.get('[role="alert"]').text()).toBe('Entry could not be created.');
        expect(useNodeStore().openedNodeId).toBe('entry-a');
    });

    it.each(['folder', 'entry'] as const)(
        'uses the selected node to create a %s and reveals its ancestors',
        async (kind) => {
            for (const selectFolder of [true, false]) {
                setActivePinia(createPinia());
                useWorldStore().setManifest(manifest());
                await flushPromises();

                const outer = node({ id: 'outer', kind: 'folder', name: 'Outer' });
                const parent = node({
                    id: 'parent',
                    parentId: outer.id,
                    kind: 'folder',
                    name: 'Parent',
                });
                const file = node({ parentId: parent.id });
                tauri.getManuscripts.mockResolvedValue({
                    status: 'ok',
                    data: [outer, parent, file],
                });
                const nodes = useNodeStore();
                await nodes.reloadNodes();
                const host = defineComponent({
                    setup: () => () =>
                        h(NodeTreeSidebar, {
                            active: true,
                            section: 'Manuscript',
                            tree: nodes.manuscripts,
                        }),
                });
                const wrapper = mount(TooltipProvider, { slots: { default: host } });
                await wrapper.get('[aria-label="Expand all"]').trigger('click');
                await wrapper.findAll('[role="treeitem"]')[selectFolder ? 1 : 2]!.trigger('click');
                await wrapper.get('[aria-label="Collapse all"]').trigger('click');
                const created = node({
                    id: 'created',
                    parentId: parent.id,
                    kind: kind === 'folder' ? 'folder' : 'manuscript_entry',
                    name: 'New item',
                });
                const create = kind === 'folder' ? tauri.createFolder : tauri.createManuscriptEntry;
                create.mockClear();
                create.mockResolvedValue({ status: 'ok', data: created.id });
                tauri.getManuscripts.mockResolvedValue({
                    status: 'ok',
                    data: [outer, parent, file, created],
                });

                await wrapper
                    .get(
                        `[aria-label="${kind === 'folder' ? 'New folder' : 'New manuscript entry'}"]`,
                    )
                    .trigger('click');
                expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(4);
                expect(
                    wrapper
                        .get('[aria-label="New item name"]')
                        .element.closest('[role="treeitem"]')
                        ?.getAttribute('aria-level'),
                ).toBe('3');
                await submitName(wrapper, ' New item ');

                if (kind === 'folder') {
                    expect(create).toHaveBeenCalledExactlyOnceWith(
                        'New item',
                        parent.id,
                        'manuscript',
                    );
                } else {
                    expect(create).toHaveBeenCalledExactlyOnceWith('New item', parent.id);
                }
                expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(4);
                expect(wrapper.get('[aria-selected="true"]').text()).toBe('New item');
                wrapper.unmount();
                sessionStorage.clear();
            }
        },
    );

    it.each(['', '   '])('discards a blank draft on blur (%j)', async (name) => {
        setActivePinia(createPinia());
        useWorldStore().setManifest(manifest());
        await flushPromises();
        const wrapper = mountTree([]);
        await wrapper.get('[aria-label="New folder"]').trigger('click');
        const input = wrapper.get('[aria-label="New item name"]');
        await input.setValue(name);
        await input.trigger('blur');
        expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(false);
        expect(tauri.createFolder).not.toHaveBeenCalled();
    });

    it('cancels inline creation and removes the draft when changing worlds', async () => {
        setActivePinia(createPinia());
        const world = useWorldStore();
        world.setManifest(manifest());
        await flushPromises();
        const wrapper = mountTree([]);
        await wrapper.get('[aria-label="New folder"]').trigger('click');
        await wrapper.get('[aria-label="New item name"]').setValue('Cancelled');
        await wrapper.get('[aria-label="New item name"]').trigger('keydown', { key: 'Escape' });
        await flushPromises();
        expect(tauri.createFolder).not.toHaveBeenCalled();
        expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(false);
        await wrapper.get('[aria-label="New folder"]').trigger('click');
        world.setManifest(manifest('other-world'));
        await flushPromises();
        expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(false);
        expect(tauri.createFolder).not.toHaveBeenCalled();
    });

    it('creates alongside a selected entry whose parent is the section root', async () => {
        const file = node({ parentId: 'manuscript-root' });
        const { wrapper, nodes } = await mountStoredTree([file]);
        await wrapper.get('[role="treeitem"]').trigger('click');
        await wrapper.get('[aria-label="New manuscript entry"]').trigger('click');
        const draft = wrapper.get('[aria-label="New item name"]');
        expect(draft.element.closest('[role="treeitem"]')?.getAttribute('aria-level')).toBe('1');
        const created = node({ id: 'new-entry', parentId: file.parentId, name: 'New entry' });
        tauri.createManuscriptEntry.mockResolvedValue({ status: 'ok', data: created.id });
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [file, created] });
        await submitName(wrapper, 'New entry');
        expect(tauri.createManuscriptEntry).toHaveBeenCalledExactlyOnceWith(
            'New entry',
            file.parentId,
        );
        expect(nodes.openedNodeId).toBe(created.id);
    });

    it('does not select or open a draft and retains its parent', async () => {
        const folder = node({ id: 'parent', kind: 'folder' });
        const { wrapper, nodes } = await mountStoredTree([folder]);
        await wrapper.get('[role="treeitem"]').trigger('click');
        await wrapper.get('[aria-label="New manuscript entry"]').trigger('click');
        const draft = wrapper.findAll('[role="treeitem"]')[1]!;
        await draft.trigger('click');
        expect(nodes.selectedNodeId).toBe(folder.id);
        expect(nodes.openedNodeId).toBeNull();
        expect(draft.attributes('aria-selected')).toBe('false');
        await wrapper.get('[aria-label="New item name"]').trigger('keydown', { key: 'Escape' });
        expect(tauri.createManuscriptEntry).not.toHaveBeenCalled();
    });

    it('ignores composing Enter and submits on ordinary Enter', async () => {
        const { wrapper, nodes } = await mountStoredTree();
        await wrapper.get('[aria-label="New manuscript entry"]').trigger('click');
        const input = wrapper.get<HTMLInputElement>('[aria-label="New item name"]');
        await input.setValue('Composed name');
        const composing = new KeyboardEvent('keydown', {
            key: 'Enter',
            isComposing: true,
            bubbles: true,
            cancelable: true,
        });
        input.element.dispatchEvent(composing);
        await flushPromises();
        expect(composing.defaultPrevented).toBe(false);
        expect(tauri.createManuscriptEntry).not.toHaveBeenCalled();
        expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(true);
        expect(input.element.value).toBe('Composed name');
        expect(input.attributes('disabled')).toBeUndefined();

        const created = node({ id: 'created', name: 'Composed name' });
        tauri.createManuscriptEntry.mockResolvedValue({ status: 'ok', data: created.id });
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [created] });
        await input.trigger('keydown', { key: 'Enter', isComposing: false });
        await flushPromises();
        expect(tauri.createManuscriptEntry).toHaveBeenCalledExactlyOnceWith('Composed name', null);
        expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(false);
        expect(nodes.openedNodeId).toBe(created.id);
    });

    it('prevents duplicate requests and retains the name for retry after an error', async () => {
        const { wrapper, nodes } = await mountStoredTree();
        const pending = deferred<{ status: 'error'; error: { code: string } }>();
        tauri.createManuscriptEntry.mockReturnValue(pending.promise);
        await wrapper.get('[aria-label="New manuscript entry"]').trigger('click');
        const input = wrapper.get('[aria-label="New item name"]');
        await input.setValue(' New entry ');
        await input.trigger('keydown', { key: 'Enter' });
        await input.trigger('blur');
        expect(tauri.createManuscriptEntry).toHaveBeenCalledExactlyOnceWith('New entry', null);
        expect(input.attributes('disabled')).toBeDefined();
        pending.resolve({ status: 'error', error: { code: 'IO' } });
        await flushPromises();
        expect(wrapper.get('[role="alert"]').text()).toBe('Entry could not be created.');
        expect(wrapper.get<HTMLInputElement>('[aria-label="New item name"]').element.value).toBe(
            ' New entry ',
        );
        const created = node({ id: 'created', name: 'New entry' });
        tauri.createManuscriptEntry.mockResolvedValue({ status: 'ok', data: created.id });
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [created] });
        await input.trigger('keydown', { key: 'Enter' });
        await flushPromises();
        expect(tauri.createManuscriptEntry).toHaveBeenCalledTimes(2);
        expect(wrapper.find('[role="alert"]').exists()).toBe(false);
        expect(nodes.openedNodeId).toBe(created.id);
    });

    it('ignores a pending result after switching worlds, including returning to the same world', async () => {
        const { wrapper, nodes, world } = await mountStoredTree();
        const pending = deferred<{ status: 'ok'; data: string }>();
        tauri.createFolder.mockReturnValue(pending.promise);
        await wrapper.get('[aria-label="New folder"]').trigger('click');
        await wrapper.get('[aria-label="New item name"]').setValue('Old folder');
        await wrapper.get('[aria-label="New item name"]').trigger('keydown', { key: 'Enter' });
        world.setManifest(manifest('other-world'));
        world.setManifest(manifest());
        pending.resolve({ status: 'ok', data: 'old-folder' });
        await flushPromises();
        expect(world.isDirty).toBe(false);
        expect(nodes.selectedNodeId).not.toBe('old-folder');
        expect(wrapper.find('[role="alert"]').exists()).toBe(false);
        expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(false);
    });

    it.each(['rejection', 'error status', 'missing node'] as const)(
        'retries only the tree read after committed creation and a refresh %s',
        async (failure) => {
            const { wrapper, nodes, world } = await mountStoredTree();
            const created = node({ id: 'created', name: 'New entry' });
            tauri.createManuscriptEntry.mockResolvedValue({ status: 'ok', data: created.id });
            if (failure === 'rejection') {
                tauri.getManuscripts.mockRejectedValueOnce(new Error('Read failed'));
            } else if (failure === 'error status') {
                tauri.getManuscripts.mockResolvedValueOnce({
                    status: 'error',
                    error: { code: 'SQLITE' },
                });
            } else {
                tauri.getManuscripts.mockResolvedValueOnce({ status: 'ok', data: [] });
            }
            await wrapper.get('[aria-label="New manuscript entry"]').trigger('click');
            await submitName(wrapper, 'New entry');

            expect(wrapper.get('[role="alert"]').text()).toContain(
                'Entry was created, but the tree could not be refreshed.',
            );
            expect(world.isDirty).toBe(true);
            expect(
                wrapper.get('[aria-label="New item name"]').attributes('disabled'),
            ).toBeDefined();
            expect(
                wrapper.get('[aria-label="New manuscript entry"]').attributes('disabled'),
            ).toBeDefined();
            tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [created] });
            await wrapper.get('button').trigger('pointerdown');
            expect(tauri.createManuscriptEntry).toHaveBeenCalledTimes(1);
            await wrapper
                .findAll('button')
                .find((button) => button.text() === 'Retry refresh')!
                .trigger('click');
            await flushPromises();

            expect(tauri.createManuscriptEntry).toHaveBeenCalledExactlyOnceWith('New entry', null);
            expect(wrapper.find('[aria-label="New item name"]').exists()).toBe(false);
            expect(wrapper.find('[role="alert"]').exists()).toBe(false);
            expect(nodes.openedNodeId).toBe(created.id);
        },
    );

    it('tracks outside-click creation until the mutation and refresh finish', async () => {
        const { wrapper, world } = await mountStoredTree();
        const pending = deferred<{ status: 'ok'; data: string }>();
        const created = node({ id: 'created', name: 'New entry' });
        tauri.createManuscriptEntry.mockReturnValueOnce(pending.promise);
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [created] });
        await wrapper.get('[aria-label="New manuscript entry"]').trigger('click');
        await wrapper.get('[aria-label="New item name"]').setValue('New entry');
        await wrapper.get('[aria-label="Filter manuscript"]').trigger('pointerdown');
        let finished = false;
        const waiting = world.waitForCreations().then(() => {
            finished = true;
        });
        await flushPromises();
        expect(finished).toBe(false);
        expect(world.isDirty).toBe(false);
        pending.resolve({ status: 'ok', data: created.id });
        await waiting;
        expect(world.isDirty).toBe(true);
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
