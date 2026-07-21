<script setup lang="ts">
import type { HeadingToggleProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useHeading } from './useHeading';

const props = withDefaults(defineProps<HeadingToggleProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showLabel: false,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:toggled': [];
}>();

const { isVisible, isActive, canToggle, label, icon, shortcutKeys, handleHeading } = useHeading({
    editor: props.editor,
    level: props.level,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onToggled: () => emits('update:toggled'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'level',
    'hideWhenUnavailable',
    'showLabel',
    'showTooltip',
    'showShortcut',
);
</script>

<template>
    <TooltipWrapper
        v-if="isVisible"
        :shortcut-keys="shortcutKeys"
        :show-shortcut="showShortcut"
        :show-tooltip="showTooltip"
    >
        <Toggle
            v-bind="delegatedProps"
            :disabled="!canToggle"
            :model-value="isActive"
            :size="showLabel ? 'default' : 'icon'"
            @click="handleHeading"
        >
            <component :is="icon" />
            <span v-if="showLabel">{{ label }}</span>
        </Toggle>

        <template #tooltip>
            {{ label }}
        </template>
    </TooltipWrapper>
</template>
