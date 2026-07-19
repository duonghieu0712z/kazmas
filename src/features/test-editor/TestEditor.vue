<script setup lang="ts">
import type { Content, EditorOptions } from '@tiptap/vue-3';

import StarterKit from '@tiptap/starter-kit';

const content: Content = {
    type: 'doc',
    content: [
        {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Test editor' }],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'This document is local and is not connected to nodes.' },
            ],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'underline', marks: [{ type: 'underline' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'strike', marks: [{ type: 'strike' }] },
                { type: 'text', text: ', and ' },
                { type: 'text', text: 'code', marks: [{ type: 'code' }] },
                { type: 'text', text: ' marks are available here.' },
            ],
        },
    ],
};

const options: Partial<EditorOptions> = {
    content,
    extensions: [StarterKit],
    autofocus: 'end',
    editable: true,
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert text-foreground font-document min-h-full w-full max-w-none px-4 py-2 wrap-break-word outline-hidden',
            spellCheck: 'false',
        },
    },
};

const marks = ['bold', 'italic', 'underline', 'strike', 'code'] as const;
</script>

<template>
    <EditorProvider
        v-slot="{ editor }"
        class="flex h-full min-w-0 flex-col overflow-hidden"
        :options="options"
    >
        <div class="flex h-9 shrink-0 items-center gap-1 border-b px-2">
            <UndoRedoButton action="undo" show-tooltip />
            <UndoRedoButton action="redo" show-tooltip />
            <MarkToggle v-for="mark in marks" :key="mark" show-tooltip :type="mark" />
        </div>

        <ScrollArea
            class="m-2 min-h-0 min-w-0 flex-1 cursor-text overflow-hidden border"
            @click="editor?.chain().focus().run()"
        >
            <EditorContent class="min-h-full w-full" />
        </ScrollArea>
    </EditorProvider>
</template>
