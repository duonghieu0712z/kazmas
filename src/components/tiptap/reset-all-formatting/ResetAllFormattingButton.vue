<script setup lang="ts">
import type { ResetAllFormattingButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';

import { useResetAllFormatting } from './use-reset-all-formatting';

const props = withDefaults(defineProps<ResetAllFormattingButtonProps>(), {
    variant: 'ghost',
    preserveMarks: () => [],
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:reset': [];
}>();

const { isVisible, canReset, label, icon, handleResetAllFormatting } = useResetAllFormatting({
    editor: props.editor,
    preserveMarks: props.preserveMarks,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onReset: () => emits('update:reset'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'preserveMarks',
    'hideWhenUnavailable',
    'showLabel',
    'showTooltip',
);
</script>

<template>
    <TooltipWrapper v-if="isVisible" :show-tooltip="showTooltip">
        <Button
            v-bind="delegatedProps"
            :disabled="!canReset"
            :size="showLabel ? 'default' : 'icon'"
            type="button"
            @click="handleResetAllFormatting"
        >
            <slot>
                <component :is="icon" />
            </slot>
            <span v-if="showLabel">{{ label }}</span>
        </Button>

        <template #tooltip>
            {{ label }}
        </template>
    </TooltipWrapper>
</template>
