<script setup lang="ts">
import type { Editor, EditorOptions } from '@tiptap/vue-3';
import type { HTMLAttributes } from 'vue';

import { useEditor } from '@tiptap/vue-3';

import { cn } from '@/lib/utils';

import { provideTiptapEditorContext } from './utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
    options?: Partial<EditorOptions>;
}>();

defineSlots<{
    default?: (props: { editor?: Editor }) => any;
}>();

const editor = useEditor(props.options);

provideTiptapEditorContext({ editor });
</script>

<template>
    <div v-bind="$attrs" :class="cn('min-h-0 w-full', props.class)" data-slot="editor-wrapper">
        <slot :editor="editor" />
    </div>
</template>
