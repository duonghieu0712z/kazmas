<script setup lang="ts">
import type { InvisibleCharactersButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useInvisibleCharacters } from './use-invisible-characters';

const props = withDefaults(defineProps<InvisibleCharactersButtonProps>(), {
    variant: 'default',
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:toggled': [];
}>();

const { isVisible, isActive, canToggle, label, icon, handleInvisibleCharacters } =
    useInvisibleCharacters({
        editor: props.editor,
        hideWhenUnavailable: props.hideWhenUnavailable,
        onToggled: () => emits('update:toggled'),
    });

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'hideWhenUnavailable',
    'showLabel',
    'showTooltip',
);
</script>

<template>
    <TooltipWrapper v-if="isVisible" :show-tooltip="showTooltip">
        <Toggle
            v-bind="delegatedProps"
            :disabled="!canToggle"
            :model-value="isActive"
            :size="showLabel ? 'default' : 'icon'"
            type="button"
            @click="handleInvisibleCharacters"
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
