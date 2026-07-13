<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import type { HTMLAttributes } from 'vue';

import { EditorContent } from '@tiptap/vue-3';

import { cn } from '@/lib/utils';

import { useTiptapEditor } from './utils';

const props = defineProps<{
    editor?: Editor;
    class?: HTMLAttributes['class'];
}>();

const context = useTiptapEditor();
console.log('content', context.editor.value);
const editor = computed(() => props.editor ?? context.editor.value);
</script>

<template>
    <EditorContent :class="cn('size-full', props.class)" :editor="editor" />
</template>
