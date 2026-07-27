<script setup lang="ts">
import type { Content } from '@tiptap/vue-3';

import { useDebounceFn } from '@vueuse/core';

import { createEditorOptions } from '@/components/tiptap/editor';
import { commands } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';

const nodes = useNodeStore();
const document = shallowRef<{ nodeId: string; content: Content }>();
const emptyDocument: Content = { type: 'doc' };

let pendingSave: { nodeId: string; content: string } | undefined;
async function saveDocument() {
    const pending = pendingSave;
    pendingSave = undefined;
    if (pending) {
        await commands.updateDocument(pending.nodeId, pending.content);
    }
}

const debouncedSaveDocument = useDebounceFn(saveDocument, 700);

const options = computed(() =>
    createEditorOptions({
        content: document.value?.content,
        onUpdate: async ({ editor }) => {
            const nodeId = document.value?.nodeId;
            if (nodeId) {
                pendingSave = {
                    nodeId,
                    content: JSON.stringify(editor.getJSON()),
                };
                await debouncedSaveDocument();
            }
        },
        onDestroy: saveDocument,
    }),
);

watch(
    () => nodes.openedNodeId,
    async (nodeId) => {
        await saveDocument();
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
</script>

<template>
    <EditorProvider
        :key="document?.nodeId"
        v-slot="{ editor }"
        class="flex h-full min-w-0 flex-col overflow-hidden"
        :options="options"
    >
        <ScrollArea
            class="m-2 min-h-0 min-w-0 flex-1 cursor-text overflow-hidden border"
            @click="editor?.chain().focus('end').run()"
        >
            <EditorContent class="min-h-full w-full" />
        </ScrollArea>
    </EditorProvider>
</template>
