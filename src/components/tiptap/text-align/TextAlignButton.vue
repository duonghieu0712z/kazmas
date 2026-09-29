<script setup lang="ts">
import type { TextAlignButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useTextAlign } from './use-text-align';

const props = withDefaults(defineProps<TextAlignButtonProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:aligned': [];
}>();

const { isVisible, isActive, canAlign, label, icon, shortcutKeys, handleTextAlign } = useTextAlign({
    editor: props.editor,
    align: props.align,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onAligned: () => emits('update:aligned'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'align',
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
            :disabled="!canAlign"
            :model-value="isActive"
            :size="showLabel ? 'default' : 'icon'"
            @click="handleTextAlign"
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
