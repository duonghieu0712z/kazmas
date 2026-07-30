<script setup lang="ts">
import type { ListButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useList } from './useList';

const props = withDefaults(defineProps<ListButtonProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:toggled': [];
}>();

const { isVisible, isActive, canToggle, label, icon, shortcutKeys, handleList } = useList({
    editor: props.editor,
    type: props.type,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onToggled: () => emits('update:toggled'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'type',
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
            @click="handleList"
        >
            <slot>
                <component :is="icon" />
            </slot>
            <span v-if="showLabel">{{ label }}</span>
        </Toggle>

        <template #tooltip>
            {{ label }}
        </template>
    </TooltipWrapper>
</template>
