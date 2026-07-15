<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

import { BubbleMenu } from '@tiptap/vue-3/menus';
import { reactiveOmit } from '@vueuse/core';
import { useForwardProps } from 'reka-ui';

import { useTiptapEditor } from '@/components/tiptap/editor';

type BubbleMenuProps = InstanceType<typeof BubbleMenu>['$props'];

const props = defineProps<
    Omit<BubbleMenuProps, 'editor'> & {
        editor?: Editor;
    }
>();

const editor = useTiptapEditor(toRef(props, 'editor'));
const delegatedProps = reactiveOmit(props, 'editor');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <BubbleMenu v-if="editor" v-bind="forwardedProps" data-slot="bubble-menu" :editor="editor">
        <slot />
    </BubbleMenu>
</template>
