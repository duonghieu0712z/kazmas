import type { EditorOptions } from '@tiptap/vue-3';

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import { flushDocumentSaves } from '@/lib/document-saves';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import { deferred, node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import Editor from './Editor.vue';

vi.mock('./options', () => ({ createEditorExtensions: () => [] }));
vi.mock('./EditorToolbar.vue', () => ({ default: { template: '<div />' } }));

const provider = defineComponent({
    name: 'EditorProvider',
    props: ['options'],
    template: '<div><slot /></div>',
});

describe('editor persistence', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const createEditor = () => {
        useNodeStore().openNode(node());
        return mount(Editor, {
            global: {
                stubs: {
                    EditorProvider: provider,
                    EditorContent: true,
                    CharacterCountIndicator: true,
                    Teleport: true,
                    ScrollArea: { template: '<div><slot /></div>' },
                },
            },
        });
    };

    const edit = (wrapper: ReturnType<typeof createEditor>, text: string) => {
        const options = wrapper.findComponent(provider).props('options') as EditorOptions;
        options.onUpdate?.({
            editor: { getJSON: () => ({ type: 'doc', content: [{ type: 'text', text }] }) },
        } as unknown as Parameters<EditorOptions['onUpdate']>[0]);
    };

    it('marks the world dirty immediately and persists the last edit after 700ms', async () => {
        vi.useFakeTimers();
        const wrapper = createEditor();
        await flushPromises();
        edit(wrapper, 'first');
        edit(wrapper, 'last');
        expect(useWorldStore().isDirty).toBe(true);
        await vi.advanceTimersByTimeAsync(699);
        expect(tauri.updateDocument).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(tauri.updateDocument).toHaveBeenCalledExactlyOnceWith(
            'entry-a',
            JSON.stringify({ type: 'doc', content: [{ type: 'text', text: 'last' }] }),
        );
    });

    it('saves the previous document before loading the next one', async () => {
        const wrapper = createEditor();
        await flushPromises();
        edit(wrapper, 'content A');
        const write = deferred<{ status: 'ok'; data: boolean }>();
        tauri.updateDocument.mockReturnValueOnce(write.promise);
        useNodeStore().openNode(node({ id: 'entry-b' }));
        await flushPromises();
        expect(tauri.getDocument).toHaveBeenCalledTimes(1);
        expect(tauri.updateDocument.mock.calls[0]?.[0]).toBe('entry-a');
        write.resolve({ status: 'ok', data: true });
        await flushPromises();
        expect(tauri.getDocument).toHaveBeenLastCalledWith('entry-b');
    });

    it('ignores a stale response when a different document is opened', async () => {
        const first = deferred<{ status: 'ok'; data: string }>();
        tauri.getDocument.mockReturnValueOnce(first.promise).mockResolvedValueOnce({
            status: 'ok',
            data: JSON.stringify({ type: 'doc', content: [] }),
        });
        const wrapper = createEditor();
        await flushPromises();
        useNodeStore().openNode(node({ id: 'entry-b' }));
        await flushPromises();
        first.resolve({
            status: 'ok',
            data: JSON.stringify({ type: 'doc', content: [{ type: 'text', text: 'stale A' }] }),
        });
        await flushPromises();
        expect(wrapper.findComponent(provider).props('options').content).toEqual({
            type: 'doc',
            content: [],
        });
    });

    it('flushes pending edits when unmounted', async () => {
        const wrapper = createEditor();
        await flushPromises();
        edit(wrapper, 'before close');
        wrapper.unmount();
        await flushDocumentSaves();
        expect(tauri.updateDocument).toHaveBeenCalledTimes(1);
    });

    it('flushes pending edits when its tab becomes inactive', async () => {
        const wrapper = createEditor();
        await flushPromises();
        edit(wrapper, 'before switching tabs');
        await wrapper.setProps({ active: false });
        await flushPromises();

        expect(tauri.updateDocument).toHaveBeenCalledWith(
            'entry-a',
            JSON.stringify({
                type: 'doc',
                content: [{ type: 'text', text: 'before switching tabs' }],
            }),
        );
    });

    it('reports an inactive save failure to the workspace and retains the write for retry', async () => {
        const wrapper = createEditor();
        await flushPromises();
        edit(wrapper, 'failed inactive save');
        tauri.updateDocument.mockResolvedValueOnce({ status: 'error', error: 'disk full' });

        await wrapper.setProps({ active: false });
        await flushPromises();

        expect(wrapper.emitted('error:save')).toHaveLength(1);
        expect(wrapper.get('[role="alert"]').text()).toBe('Document could not be saved.');
        await wrapper.setProps({ active: true });
        await wrapper.setProps({ active: false });
        await flushPromises();

        expect(tauri.updateDocument).toHaveBeenCalledTimes(2);
        expect(tauri.updateDocument.mock.calls[1]).toEqual(tauri.updateDocument.mock.calls[0]);
        expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });

    it('rejects closing after a failed save and allows a successful retry', async () => {
        const wrapper = createEditor();
        await flushPromises();
        edit(wrapper, 'before closing tab');
        tauri.updateDocument.mockResolvedValueOnce({ status: 'error', error: 'disk full' });

        expect(await wrapper.vm.prepareClose()).toBe(false);
        expect(wrapper.get('[role="alert"]').text()).toBe('Document could not be saved.');
        expect(await wrapper.vm.prepareClose()).toBe(true);
        expect(wrapper.find('[role="alert"]').exists()).toBe(false);
        expect(tauri.updateDocument).toHaveBeenCalledTimes(2);
    });

    it.each([
        { status: 'ok' as const, data: '{broken' },
        { status: 'error' as const, error: 'Read failed' },
    ])('shows document load errors without throwing from the watcher: %j', async (result) => {
        tauri.getDocument.mockResolvedValue(result);
        const wrapper = createEditor();
        await flushPromises();
        expect(wrapper.get('[role="alert"]').text()).toBe('Document could not be loaded.');
        expect(tauri.updateDocument).not.toHaveBeenCalled();
    });

    it('keeps failed writes available for retry and shows a save error', async () => {
        vi.useFakeTimers();
        const wrapper = createEditor();
        await flushPromises();
        tauri.updateDocument.mockResolvedValueOnce({ status: 'error', error: 'disk full' });
        edit(wrapper, 'retry content');
        await vi.advanceTimersByTimeAsync(700);
        expect(wrapper.get('[role="alert"]').text()).toBe('Document could not be saved.');
        await flushDocumentSaves();
        expect(tauri.updateDocument).toHaveBeenCalledTimes(2);
    });
});
