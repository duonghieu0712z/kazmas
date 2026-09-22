<script setup lang="ts">
import type { TextAlign, TextAlignGroupProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { ButtonGroup } from '@/components/ui/button-group';

import TextAlignButton from './TextAlignButton.vue';

const props = withDefaults(defineProps<TextAlignGroupProps>(), {
    aligns: () => ['left', 'center', 'right', 'justify'],
    orientation: 'horizontal',
    spacing: 'spaced',
});

const emits = defineEmits<{
    'update:aligned': [align: TextAlign];
}>();

const delegatedProps = reactiveOmit(props, 'editor', 'aligns');

function handleAligned(align: TextAlign) {
    emits('update:aligned', align);
}
</script>

<template>
    <ButtonGroup v-bind="delegatedProps">
        <TextAlignButton
            v-for="align in aligns"
            :key="align"
            :align="align"
            :editor="editor"
            @update:aligned="handleAligned(align)"
        />
    </ButtonGroup>
</template>
