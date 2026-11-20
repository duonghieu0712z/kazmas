<script setup lang="ts">
import type { TextColorGroupProps, TextColorPresetValue } from '.';

import { reactiveOmit } from '@vueuse/core';

import { ButtonGroup } from '@/components/ui/button-group';

import TextColorPreset from './TextColorPreset.vue';

const props = withDefaults(defineProps<TextColorGroupProps>(), {
    orientation: 'horizontal',
    spacing: 'spaced',
    showTooltip: true,
});

const emits = defineEmits<{ select: [preset: TextColorPresetValue] }>();

const delegatedProps = reactiveOmit(props, 'presets', 'activePreset', 'disabled', 'showTooltip');
</script>

<template>
    <ButtonGroup v-bind="delegatedProps">
        <TextColorPreset
            v-for="preset in presets"
            :key="preset.id"
            :active="activePreset === preset"
            :disabled="disabled"
            :preset="preset"
            :show-tooltip="showTooltip"
            @select="emits('select', preset)"
        />
    </ButtonGroup>
</template>
