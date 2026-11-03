<script setup lang="ts">
import type { HighlightPresetProps } from '.';

import { CaseSensitiveIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { ColorSwatch } from '@/components/ui/color';
import { Toggle } from '@/components/ui/toggle';
import { getHighlightPresetStyle } from '@/lib/highlight';

import { useHighlight } from './use-highlight';

const props = withDefaults(defineProps<HighlightPresetProps>(), {
    variant: 'default',
    showTooltip: true,
    hideWhenUnavailable: false,
});

const emits = defineEmits<{ 'update:highlighted': [] }>();

const presets = computed(() => [props.preset]);

const { canHighlight, activePreset, isVisible, handleHighlight } = useHighlight({
    editor: () => props.editor,
    presets,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
    onHighlighted: () => emits('update:highlighted'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'preset',
    'showTooltip',
    'hideWhenUnavailable',
);
</script>

<template>
    <TooltipWrapper v-if="isVisible" :show-tooltip="showTooltip">
        <Toggle
            v-bind="delegatedProps"
            :aria-label="`${preset.label} highlight`"
            :disabled="!canHighlight || props.disabled"
            :model-value="!!activePreset"
            size="icon"
            @click="handleHighlight(preset)"
            @mousedown.prevent
        >
            <slot>
                <ColorSwatch
                    aria-hidden="true"
                    as="span"
                    :color="preset.backgroundColor"
                    :label="preset.label"
                    :style="getHighlightPresetStyle(preset)"
                >
                    <CaseSensitiveIcon />
                </ColorSwatch>
            </slot>
        </Toggle>

        <template #tooltip>{{ preset.label }}</template>
    </TooltipWrapper>
</template>
