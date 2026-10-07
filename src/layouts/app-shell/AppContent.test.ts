import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, onBeforeUnmount, ref } from 'vue';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useNodeStore } from '@/stores/nodes';
import { useWorkspaceStore } from '@/stores/workspace';

import { node } from '../../../tests/support/fixtures';
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
        const editor = defineComponent({
            name: 'Editor',
            props: ['nodeId', 'active'],
            setup(props, { expose }) {
                const text = ref(props.nodeId);
                expose({ prepareClose: () => prepareClose(props.nodeId) });
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
        return { wrapper, nodes, workspace: useWorkspaceStore(), prepareClose, unmounted };
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
        await wrapper.get('[role="tab"][aria-selected="false"]').trigger('mousedown', {
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
});
