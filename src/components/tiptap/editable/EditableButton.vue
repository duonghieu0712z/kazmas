<script setup lang="ts">
import type { EditableButtonProps } from '.';

import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

import { useEditable } from './use-editable';

const props = withDefaults(defineProps<EditableButtonProps>(), {
    variant: 'default',
    showLabel: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:editable': [editable: boolean];
}>();

const { isEditable, canToggle, label, icon, handleEditable } = useEditable({
    editor: () => props.editor,
    onChanged: (editable) => emits('update:editable', editable),
});

const delegatedProps = reactiveOmit(props, 'editor', 'showLabel', 'showTooltip');
</script>

<template>
    <TooltipWrapper :show-tooltip="showTooltip">
        <Toggle
            v-bind="delegatedProps"
            :aria-label="showLabel ? undefined : label"
            class="text-muted-foreground"
            :disabled="!canToggle"
            :model-value="isEditable"
            :size="showLabel ? 'default' : 'icon'"
            type="button"
            @click="handleEditable"
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
