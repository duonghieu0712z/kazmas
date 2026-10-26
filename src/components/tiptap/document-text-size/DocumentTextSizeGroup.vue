<script setup lang="ts">
import type { DocumentTextSizeGroupProps } from '.';
import type { DocumentTextSizeValue } from '@/extensions/tiptap';

import { reactiveOmit } from '@vueuse/core';
import { computed } from 'vue';

import { ButtonGroup } from '@/components/ui/button-group';

import DocumentTextSizePreset from './DocumentTextSizePreset.vue';
import { DOCUMENT_TEXT_SIZE_PRESETS } from './presets';

const props = withDefaults(defineProps<DocumentTextSizeGroupProps>(), {
    orientation: 'horizontal',
    spacing: 'spaced',
    presetCount: 3,
});

const emits = defineEmits<{ 'update:changed': [textSize: DocumentTextSizeValue] }>();

const presets = computed(() => {
    if (props.presetCount === 5) {
        return DOCUMENT_TEXT_SIZE_PRESETS;
    }

    return DOCUMENT_TEXT_SIZE_PRESETS.slice(1, -1);
});

const delegatedProps = reactiveOmit(props, 'editor', 'presetCount', 'hideWhenUnavailable');
</script>

<template>
    <ButtonGroup v-bind="delegatedProps" aria-label="Document text size presets">
        <DocumentTextSizePreset
            v-for="preset in presets"
            :key="preset.label"
            :editor="editor"
            :hide-when-unavailable="hideWhenUnavailable"
            :preset="preset"
            @update:changed="emits('update:changed', preset.value)"
        />
    </ButtonGroup>
</template>
