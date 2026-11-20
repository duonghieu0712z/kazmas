<script setup lang="ts">
import type { LineHeightGroupProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { ButtonGroup } from '@/components/ui/button-group';

import LineHeightPreset from './LineHeightPreset.vue';
import { LINE_HEIGHT_PRESETS } from './presets';

const props = withDefaults(defineProps<LineHeightGroupProps>(), {
    orientation: 'horizontal',
    spacing: 'spaced',
});

const emits = defineEmits<{ 'update:changed': [lineHeight: number] }>();

const delegatedProps = reactiveOmit(props, 'editor', 'hideWhenUnavailable');
</script>

<template>
    <ButtonGroup v-bind="delegatedProps" aria-label="Line height presets">
        <LineHeightPreset
            v-for="preset in LINE_HEIGHT_PRESETS"
            :key="preset.label"
            :editor="editor"
            :hide-when-unavailable="hideWhenUnavailable"
            :preset="preset"
            @update:changed="emits('update:changed', preset.value)"
        />
    </ButtonGroup>
</template>
