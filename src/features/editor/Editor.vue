<script setup lang="ts">
import type { Content, EditorOptions } from '@tiptap/vue-3';

import StarterKit from '@tiptap/starter-kit';

const props = withDefaults(
    defineProps<{
        content?: Content;
        editable?: boolean;
    }>(),
    {
        editable: true,
    },
);

const options: Partial<EditorOptions> = {
    ...props,
    extensions: [StarterKit],
    autofocus: 'end',
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert text-foreground font-document min-h-full w-full max-w-none px-4 py-2 wrap-break-word outline-none',
            spellCheck: 'false',
        },
    },
    onUpdate: ({ editor }) => {
        console.debug('Editor updated', editor.getJSON());
    },
};
</script>

<template>
    <EditorProvider
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
