<script setup lang="ts">
import type { DocumentTextSizePresetProps } from '.';

import { reactiveOmit } from '@vueuse/core';
import { computed } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useDocumentTextSize } from './use-document-text-size';

const props = withDefaults(defineProps<DocumentTextSizePresetProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{ 'update:changed': [] }>();

const presets = computed(() => [props.preset]);

const { activePreset, canSet, isVisible, handleDocumentTextSize } = useDocumentTextSize({
    editor: () => props.editor,
    presets,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
    onChanged: () => emits('update:changed'),
});

const isDisabled = computed(() => !!props.disabled || !canSet.value);

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'preset',
    'hideWhenUnavailable',
    'showTooltip',
);
</script>

<template>
    <TooltipWrapper v-if="isVisible" :show-tooltip="showTooltip">
        <Toggle
            v-bind="delegatedProps"
            :aria-label="preset.label"
            class="text-editor-toolbar-foreground"
            :disabled="isDisabled"
            :model-value="!!activePreset"
            size="icon"
            @click="handleDocumentTextSize(preset.value)"
            @mousedown.prevent
        >
            <slot>
                <span aria-hidden="true" class="leading-none" :class="preset.textClass"> A </span>
            </slot>
        </Toggle>

        <template #tooltip>{{ preset.label }}</template>
    </TooltipWrapper>
</template>
