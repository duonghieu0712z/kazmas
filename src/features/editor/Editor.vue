<script setup lang="ts">
import type { Content } from '@tiptap/vue-3';

import { useDebounceFn } from '@vueuse/core';

import { createEditorOptions } from '@/components/tiptap/editor';
import { commands } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';

const nodes = useNodeStore();
const document = shallowRef<{ nodeId: string; content: Content }>();
const emptyDocument: Content = { type: 'doc' };

const debouncedSaveDocument = useDebounceFn(
    (nodeId: string, content: string) => commands.updateDocument(nodeId, content),
    700,
);

function flushDocumentSave() {
    if (debouncedSaveDocument.isPending.value) {
        debouncedSaveDocument.flush();
    }
}

const options = computed(() =>
    createEditorOptions({
        content: document.value?.content,
        onUpdate: ({ editor }) => {
            const nodeId = document.value?.nodeId;
            if (nodeId) {
                void debouncedSaveDocument(nodeId, JSON.stringify(editor.getJSON()));
            }
        },
        onDestroy: flushDocumentSave,
    }),
);

watch(
    () => nodes.openedNodeId,
    async (nodeId) => {
        flushDocumentSave();
        document.value = undefined;
        if (!nodeId) {
            return;
        }

        const result = await commands.getDocument(nodeId);
        if (nodes.openedNodeId === nodeId && result.status === 'ok') {
            document.value = {
                nodeId,
                content: result.data ? JSON.parse(result.data) : emptyDocument,
            };
        }
    },
    { immediate: true },
);

onBeforeUnmount(flushDocumentSave);
</script>

<template>
    <div class="flex h-full min-w-0 flex-col overflow-hidden">
        <EditorProvider :key="document?.nodeId" :options="options">
            <ScrollArea class="min-h-0 min-w-0 flex-1 overflow-hidden" horizontal>
                <div class="flex min-h-full w-full min-w-max items-stretch justify-center p-2">
                    <EditorContent class="w-3xl shrink-0 cursor-text self-stretch border" />
                </div>
            </ScrollArea>
        </EditorProvider>
    </div>
</template>
