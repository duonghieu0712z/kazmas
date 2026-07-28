<script setup lang="ts">
import type { ParagraphButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useParagraph } from './useParagraph';

const props = withDefaults(defineProps<ParagraphButtonProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:set': [];
}>();

const { isVisible, isActive, canSet, label, icon, shortcutKeys, handleParagraph } = useParagraph({
    editor: props.editor,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onSet: () => emits('update:set'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
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
            :disabled="!canSet"
            :model-value="isActive"
            :size="showLabel ? 'default' : 'icon'"
            @click="handleParagraph"
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
