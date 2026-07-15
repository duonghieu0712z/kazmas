<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';

import { FloatingMenu } from '@tiptap/vue-3/menus';
import { reactiveOmit } from '@vueuse/core';
import { useForwardProps } from 'reka-ui';

import { useTiptapEditor } from '@/components/tiptap/editor';

type FloatingMenuProps = InstanceType<typeof FloatingMenu>['$props'];

const props = defineProps<
    Omit<FloatingMenuProps, 'editor'> & {
        editor?: Editor;
    }
>();

const editor = useTiptapEditor(toRef(props, 'editor'));

const delegatedProps = reactiveOmit(props, 'editor');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <FloatingMenu v-if="editor" v-bind="forwardedProps" data-slot="floating-menu" :editor="editor">
        <slot />
    </FloatingMenu>
</template>
