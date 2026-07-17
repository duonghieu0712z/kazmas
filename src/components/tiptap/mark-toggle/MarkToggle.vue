<script setup lang="ts">
import type { MarkToggleProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';

import { useMark } from './useMark';

const props = withDefaults(defineProps<MarkToggleProps>(), {
    variant: 'default',
    size: 'icon',
    hideWhenUnavailable: false,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:toggled': [];
}>();

const { isVisible, isActive, canToggle, label, icon, shortcutKeys, handleMark } = useMark({
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
    'text',
    'showTooltip',
    'showShortcut',
);
</script>

<template>
    <TooltipWrapper v-if="isVisible" :shortcut-keys="shortcutKeys" :show-tooltip="showTooltip">
        <Toggle
            v-bind="delegatedProps"
            :disabled="!canToggle"
            :model-value="isActive"
            @click="handleMark"
        >
            <component :is="icon" />
            {{ text }}
            <Badge v-if="showShortcut">{{ shortcutKeys }}</Badge>
        </Toggle>

        <template #tooltip>
            {{ label }}
        </template>
    </TooltipWrapper>
</template>
