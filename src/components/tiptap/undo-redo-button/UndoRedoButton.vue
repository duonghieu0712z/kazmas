<script setup lang="ts">
import type { UndoRedoButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';

import { useUndoRedo } from './useUndoRedo';

const props = withDefaults(defineProps<UndoRedoButtonProps>(), {
    variant: 'ghost',
    hideWhenUnavailable: false,
    showLabel: false,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:executed': [];
}>();

const { isVisible, canToggle, label, icon, shortcutKeys, handleAction } = useUndoRedo({
    editor: props.editor,
    action: props.action,
    label: props.label,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onExecuted: () => emits('update:executed'),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'action',
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
        <Button
            v-bind="delegatedProps"
            :disabled="!canToggle"
            :size="showLabel ? 'default' : 'icon'"
            @click="handleAction"
        >
            <component :is="icon" />
            <span v-if="showLabel">{{ label }}</span>
        </Button>

        <template #tooltip>
            {{ label }}
        </template>
    </TooltipWrapper>
</template>
