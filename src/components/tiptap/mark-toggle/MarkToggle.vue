<script setup lang="ts">
import type { MarkToggleProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useMark } from './useMark';

const props = withDefaults(defineProps<MarkToggleProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:toggled': [];
}>();

const { isVisible, isActive, canToggle, label, icon, shortcutKeys, handleMark } = useMark({
    editor: props.editor,
    type: props.type,
    label: props.label,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onToggled: () => emits('update:toggled'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'type',
    'hideWhenUnavailable',
    'label',
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
            @click="handleMark"
        >
            <component :is="icon" />
            {{ showLabel && label }}
        </Toggle>

        <template #tooltip>
            {{ label }}
        </template>
    </TooltipWrapper>
</template>
