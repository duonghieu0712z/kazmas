<script setup lang="ts">
import type { Content, FocusPosition } from '@tiptap/vue-3';
import type { HTMLAttributes } from 'vue';

import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';

const props = withDefaults(
    defineProps<{
        class?: HTMLAttributes['class'];
        content?: Content;
        autoFocus?: FocusPosition;
        editable?: boolean;
        textDirection?: 'ltr' | 'rtl' | 'auto';
    }>(),
    {
        autoFocus: 'end',
        editable: true,
    },
);

const editor = useEditor({
    content: props.content,
    extensions: [StarterKit],
    autofocus: props.autoFocus,
    editable: props.editable,
    textDirection: props.textDirection,
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
        },
    },
});
</script>

<template>
    <EditorContent :class="props.class" :editor="editor" />
</template>
