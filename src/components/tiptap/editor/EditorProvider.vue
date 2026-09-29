<script setup lang="ts">
import type { Editor, EditorOptions } from '@tiptap/vue-3';

import { useEditor } from '@tiptap/vue-3';

import { provideTiptapEditorContext } from './context';

const props = defineProps<{
    options?: Partial<EditorOptions>;
}>();

defineSlots<{
    default?: (props: { editor?: Editor }) => any;
}>();

const editor = useEditor(props.options);

provideTiptapEditorContext({ editor });
</script>

<template>
    <slot :editor="editor" />
</template>
