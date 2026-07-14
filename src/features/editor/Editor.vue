<script setup lang="ts">
import type { Content, EditorOptions } from '@tiptap/vue-3';

import StarterKit from '@tiptap/starter-kit';
import { useDebounceFn } from '@vueuse/core';

import { commands } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';

const nodes = useNodeStore();
const document = shallowRef<{ nodeId: string; content: Content }>();

let pendingSave: { nodeId: string; content: string } | undefined;
async function saveDocument() {
    const pending = pendingSave;
    pendingSave = undefined;
    if (pending) {
        await commands.updateDocument(pending.nodeId, pending.content);
    }
}

const debouncedSaveDocument = useDebounceFn(saveDocument, 700);

const options = computed<Partial<EditorOptions>>(() => ({
    content: document.value?.content,
    extensions: [StarterKit],
    autofocus: 'end',
    editable: true,
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert text-foreground font-document min-h-full w-full max-w-none px-4 py-2 wrap-break-word outline-none',
            spellCheck: 'false',
        },
    },
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
}));

watch(
    () => nodes.selectedNodeId,
    async (nodeId) => {
        await saveDocument();
        document.value = undefined;
        if (!nodeId) {
            return;
        }

        const result = await commands.getDocument(nodeId);
        if (nodes.selectedNodeId === nodeId && result.status === 'ok' && result.data) {
            document.value = {
                nodeId,
                content: JSON.parse(result.data),
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
            @click="editor?.chain().focus().run()"
        >
            <EditorContent class="min-h-full w-full" />
        </ScrollArea>
    </EditorProvider>
</template>
