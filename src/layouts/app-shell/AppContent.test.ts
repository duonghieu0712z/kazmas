import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, onBeforeUnmount, ref } from 'vue';

import { TooltipProvider } from '@/components/ui/tooltip';
import { executeMenuCommand } from '@/menus';
import { useContextMenuProvider } from '@/providers/context-menu';
import { useNodeStore } from '@/stores/nodes';
import { useWorkspaceStore } from '@/stores/workspace';
import { useWorldStore } from '@/stores/world';

import { deferred, manifest, node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import AppContent from './AppContent.vue';

describe('workspace content', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const createContent = async () => {
        tauri.getManuscripts.mockResolvedValue({
            status: 'ok',
            data: [node(), node({ id: 'entry-b', name: 'Chapter B' })],
        });
        const nodes = useNodeStore();
        await nodes.reloadNodes();
        const prepareClose = vi.fn<(nodeId: string) => Promise<boolean>>().mockResolvedValue(true);
        const unmounted = vi.fn();
        const saveErrors = ref<Record<string, boolean>>({});
        const editor = defineComponent({
            name: 'Editor',
            props: ['nodeId', 'active'],
            setup(props, { expose }) {
                const text = ref(props.nodeId);
                expose({
                    prepareClose: () => prepareClose(props.nodeId),
                    hasSaveError: computed(() => !!saveErrors.value[props.nodeId]),
                });
                onBeforeUnmount(() => unmounted(props.nodeId));
                return () =>
                    h('input', {
                        'aria-label': props.nodeId,
                        value: text.value,
                        onInput: (event: Event) => {
                            text.value = (event.target as HTMLInputElement).value;
                        },
                    });
            },
        });
        const wrapper = mount(
            defineComponent({ setup: () => () => h(TooltipProvider, null, () => h(AppContent)) }),
            {
                global: {
                    stubs: {
                        SidebarInset: { template: '<div><slot /></div>' },
                        Editor: editor,
                    },
                },
            },
        );
        return {
            wrapper,
            nodes,
            workspace: useWorkspaceStore(),
            prepareClose,
            unmounted,
            saveErrors,
        };
    };

    it('starts empty and preserves mounted document state when switching tabs', async () => {
        const warn = vi.spyOn(console, 'warn');
        const { wrapper, nodes, unmounted } = await createContent();
        expect(wrapper.findAll('[role="tab"]')).toHaveLength(0);
        nodes.openNode(node());
        await flushPromises();
        const tab = wrapper.get('[role="tab"]');
        expect(tab.element.tagName).toBe('DIV');
        expect(tab.element.parentElement?.tagName).toBe('DIV');
        expect(tab.element.parentElement?.getAttribute('data-slot')).toBe('tooltip-trigger');
        await wrapper.get('input[aria-label="entry-a"]').setValue('Unsaved draft');
        nodes.openNode(node({ id: 'entry-b' }));
        await flushPromises();
        await wrapper.get('[role="tab"][aria-selected="false"]').trigger('click', {
            button: 0,
            ctrlKey: false,
        });
        await flushPromises();

        expect(nodes.openedNodeId).toBe('entry-a');
        expect(wrapper.get('input[aria-label="entry-a"]').element).toHaveProperty(
            'value',
            'Unsaved draft',
        );
        expect(unmounted).not.toHaveBeenCalled();
        expect(
            warn.mock.calls.some((args) =>
                args.some(
                    (value) =>
                        typeof value === 'string' &&
                        value.includes('Vue received a Component that was made a reactive object'),
                ),
            ),
        ).toBe(false);
    });

    it('keeps a tab open when its content cannot be saved', async () => {
        const { wrapper, nodes, workspace, prepareClose, unmounted } = await createContent();
        nodes.openNode(node());
        nodes.openNode(node({ id: 'entry-b' }));
        await flushPromises();
        prepareClose.mockResolvedValueOnce(false);
        await wrapper.get('button[aria-label="Close Chapter A"]').trigger('click');
        await flushPromises();

        expect(prepareClose).toHaveBeenCalledWith('entry-a');
        expect(workspace.tabs).toHaveLength(2);
        expect(workspace.activeDocumentId).toBe('entry-a');
        expect(unmounted).not.toHaveBeenCalled();
        await wrapper.get('button[aria-label="Close Chapter A"]').trigger('click');
        await flushPromises();
        expect(workspace.activeDocumentId).toBe('entry-b');
        expect(unmounted).toHaveBeenCalledWith('entry-a');
    });

    it('reveals an inactive tab when its editor reports a save failure', async () => {
        const { wrapper, nodes, workspace } = await createContent();
        nodes.openNode(node());
        nodes.openNode(node({ id: 'entry-b' }));
        await flushPromises();

        const editor = wrapper.findAllComponents({ name: 'Editor' })[0]!;
        editor.vm.$emit('error:save');
        await flushPromises();

        expect(workspace.activeDocumentId).toBe('entry-a');
        expect(editor.props('active')).toBe(true);
    });

    it('keeps the visible save failure active when another editor also fails', async () => {
        const { wrapper, nodes, workspace, saveErrors } = await createContent();
        nodes.openNode(node());
        nodes.openNode(node({ id: 'entry-b' }));
        await flushPromises();
        const editors = wrapper.findAllComponents({ name: 'Editor' });

        saveErrors.value['entry-a'] = true;
        editors[0]!.vm.$emit('error:save');
        await flushPromises();
        saveErrors.value['entry-b'] = true;
        editors[1]!.vm.$emit('error:save');
        await flushPromises();
        expect(workspace.activeDocumentId).toBe('entry-a');

        saveErrors.value['entry-a'] = false;
        editors[1]!.vm.$emit('error:save');
        await flushPromises();
        expect(workspace.activeDocumentId).toBe('entry-b');
    });

    it('refreshes tab labels and breadcrumbs when node metadata changes', async () => {
        const { wrapper, nodes } = await createContent();
        nodes.openNode(node());
        await flushPromises();
        tauri.getManuscripts.mockResolvedValue({
            status: 'ok',
            data: [node({ name: 'Revised chapter' })],
        });
        await nodes.reloadNodes();
        await flushPromises();

        expect(wrapper.get('[role="tab"]').text()).toBe('Revised chapter');
        expect(wrapper.get('header').text()).toContain('Revised chapter');
    });

    it('ignores a cached menu command after its target tab is closed and reopened', async () => {
        const { wrapper, nodes, workspace, prepareClose } = await createContent();
        const world = useWorldStore();
        world.setManifest(manifest());
        await world.waitForNodes();
        nodes.openNode(node());
        await flushPromises();
        const provider = useContextMenuProvider();
        try {
            await wrapper.get('[role="tab"]').trigger('contextmenu');
            const item = toValue(provider.activeContextMenu.value!.items).find(
                (item) => item.id === 'close-tab',
            );
            if (item?.type !== 'item') {
                throw new Error('Close Tab is unavailable.');
            }
            workspace.closeTab(workspace.tabs[0]!.id);
            nodes.openNode(node());
            await executeMenuCommand(item.command);
            expect(workspace.tabs).toHaveLength(1);
            expect(prepareClose).not.toHaveBeenCalled();
            world.setManifest(manifest('other-world'));
            await world.waitForNodes();
            nodes.openNode(node());
            await executeMenuCommand(item.command);
            expect(workspace.tabs).toHaveLength(1);
            expect(prepareClose).not.toHaveBeenCalled();
        } finally {
            provider.closeContextMenu();
        }
    });

    it('disables closing items during a pending batch and ignores repeated execution', async () => {
        const { wrapper, nodes, workspace, prepareClose } = await createContent();
        const world = useWorldStore();
        world.setManifest(manifest());
        await world.waitForNodes();
        nodes.openNode(node());
        nodes.openNode(node({ id: 'entry-b' }));
        await flushPromises();
        const pending = deferred<boolean>();
        prepareClose.mockReturnValueOnce(pending.promise);
        const provider = useContextMenuProvider();
        try {
            await wrapper.get('[role="tab"]').trigger('contextmenu');
            const item = toValue(provider.activeContextMenu.value!.items).find(
                (item) => item.id === 'close-all-tabs',
            );
            if (item?.type !== 'item') {
                throw new Error('Close All Tabs is unavailable.');
            }
            const closing = executeMenuCommand(item.command);
            await executeMenuCommand(item.command);
            const closingItems = toValue(provider.activeContextMenu.value!.items).filter((item) =>
                item.id.startsWith('close-'),
            );
            expect(
                closingItems.every((item) => item.type === 'item' && item.enabled === false),
            ).toBe(true);
            expect(prepareClose).toHaveBeenCalledExactlyOnceWith('entry-a');
            pending.resolve(false);
            await closing;
            expect(workspace.tabs).toHaveLength(2);
            expect(workspace.activeDocumentId).toBe('entry-a');
        } finally {
            provider.closeContextMenu();
        }
    });
});
