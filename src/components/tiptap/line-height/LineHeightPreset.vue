<script setup lang="ts">
import type { LineHeightPresetProps } from '.';

import { reactiveOmit } from '@vueuse/core';
import { computed } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useLineHeight } from './use-line-height';

const props = withDefaults(defineProps<LineHeightPresetProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{ 'update:changed': [] }>();

const presets = computed(() => [props.preset]);

const { activePreset, canSet, isVisible, handleLineHeight } = useLineHeight({
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
            size="default"
            @click="handleLineHeight(preset.value)"
            @mousedown.prevent
        >
            <slot>
                {{ preset.label }}
            </slot>
        </Toggle>

        <template #tooltip>{{ preset.label }}</template>
    </TooltipWrapper>
</template>
