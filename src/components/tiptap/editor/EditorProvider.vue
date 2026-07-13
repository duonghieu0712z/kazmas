<script setup lang="ts">
import type { EditorOptions } from '@tiptap/vue-3';
import type { HTMLAttributes } from 'vue';

import StarterKit from '@tiptap/starter-kit';
import { useEditor } from '@tiptap/vue-3';
import { reactiveOmit } from '@vueuse/core';

import { cn } from '@/lib/utils';

import { provideTiptapEditorContext } from './utils';

const props = withDefaults(
    defineProps<
        Partial<EditorOptions> & {
            class?: HTMLAttributes['class'];
        }
    >(),
    {
        extensions: () => [StarterKit],
        autofocus: true,
        editable: true,
        editorProps: () => ({
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
            },
        }),
    },
);

const options = reactiveOmit(props, 'class');
const editor = useEditor(options);

provideTiptapEditorContext({ editor });
</script>

<template>
    <div
        v-bind="$attrs"
        :class="cn('group/editor-wrapper size-full', props.class)"
        data-slot="editor-wrapper"
    >
        <slot />
    </div>
</template>
