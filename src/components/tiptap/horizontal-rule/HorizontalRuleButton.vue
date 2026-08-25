<script setup lang="ts">
import type { HorizontalRuleButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';

import { useHorizontalRule } from './use-horizontal-rule';

const props = withDefaults(defineProps<HorizontalRuleButtonProps>(), {
    variant: 'ghost',
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:inserted': [];
}>();

const { isVisible, canInsert, label, icon, handleHorizontalRule } = useHorizontalRule({
    editor: props.editor,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onInserted: () => emits('update:inserted'),
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
        <Button
            v-bind="delegatedProps"
            :disabled="!canInsert"
            :size="showLabel ? 'default' : 'icon'"
            type="button"
            @click="handleHorizontalRule"
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
