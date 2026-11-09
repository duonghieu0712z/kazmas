<script setup lang="ts">
import type { HighlightGroupProps } from '.';
import type { HighlightPresetValue } from './presets';

import { reactiveOmit } from '@vueuse/core';

import { ButtonGroup } from '@/components/ui/button-group';

import HighlightPreset from './HighlightPreset.vue';
import { HIGHLIGHT_PRESETS } from './presets';

const props = withDefaults(defineProps<HighlightGroupProps>(), {
    presets: () => HIGHLIGHT_PRESETS,
    orientation: 'horizontal',
    spacing: 'spaced',
});

const emits = defineEmits<{ 'update:highlighted': [preset: HighlightPresetValue] }>();

const delegatedProps = reactiveOmit(props, 'editor', 'presets', 'hideWhenUnavailable');

function handleHighlighted(preset: HighlightPresetValue) {
    emits('update:highlighted', preset);
}
</script>

<template>
    <ButtonGroup v-bind="delegatedProps" aria-label="Highlight presets">
        <HighlightPreset
            v-for="preset in presets"
            :key="preset.id"
            :editor="editor"
            :hide-when-unavailable="hideWhenUnavailable"
            :preset="preset"
            @update:highlighted="handleHighlighted(preset)"
        />
    </ButtonGroup>
</template>
