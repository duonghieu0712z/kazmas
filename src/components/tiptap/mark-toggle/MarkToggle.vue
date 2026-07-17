<script setup lang="ts">
import type { MarkToggleProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useMark } from './useMark';

const props = withDefaults(defineProps<MarkToggleProps>(), {
    variant: 'default',
    size: 'icon',
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
    <template v-if="isVisible">
        <Tooltip v-if="showTooltip">
            <TooltipTrigger>
                <Toggle
                    v-bind="delegatedProps"
                    :disabled="!canToggle"
                    :model-value="isActive"
                    @click="handleMark"
                >
                    <component :is="icon" />
                    {{ text }}
                </Toggle>
            </TooltipTrigger>

            <TooltipContent>
                {{ label }}
                <span v-if="showShortcut">{{ shortcutKeys.join(' ') }}</span>
            </TooltipContent>
        </Tooltip>

        <template v-else>
            <Toggle
                v-bind="delegatedProps"
                :disabled="!canToggle"
                :model-value="isActive"
                @click="handleMark"
            >
                <component :is="icon" />
                {{ text }}
            </Toggle>
        </template>
    </template>
</template>
