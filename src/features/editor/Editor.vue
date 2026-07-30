<script setup lang="ts">
import type { Content, EditorOptions } from '@tiptap/vue-3';

import StarterKit from '@tiptap/starter-kit';
import { useDebounceFn } from '@vueuse/core';

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

const options = computed<Partial<EditorOptions>>(() => ({
    content: document.value?.content,
    extensions: [StarterKit],
    autofocus: 'end',
    editable: true,
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert text-foreground font-document min-h-full w-full max-w-none px-4 py-2 wrap-break-word outline-hidden',
            spellCheck: 'false',
        },
    },
    onUpdate: ({ editor }) => {
        const nodeId = document.value?.nodeId;
        if (nodeId) {
            void debouncedSaveDocument(nodeId, JSON.stringify(editor.getJSON()));
        }
    },
    onDestroy: flushDocumentSave,
}));

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
