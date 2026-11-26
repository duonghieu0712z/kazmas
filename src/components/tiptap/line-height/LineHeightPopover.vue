<script setup lang="ts">
import type { LineHeightPopoverProps } from '.';

import { ChevronDownIcon, ListChevronsUpDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

import LineHeightGroup from './LineHeightGroup.vue';
import { useLineHeight } from './use-line-height';

const props = withDefaults(defineProps<LineHeightPopoverProps>(), {
    variant: 'default',
    orientation: 'horizontal',
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:changed': [lineHeight: number];
    'update:open': [open: boolean];
}>();

const open = ref(false);

const { canSet, isVisible, label } = useLineHeight({
    editor: () => props.editor,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
});

const isDisabled = computed(() => !!props.disabled || !canSet.value);

watch(open, (value) => emits('update:open', value));

watch(isDisabled, (disabled) => {
    if (disabled) {
        open.value = false;
    }
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'orientation',
    'hideWhenUnavailable',
    'showTooltip',
);

function handleChanged(lineHeight: number) {
    open.value = false;
    emits('update:changed', lineHeight);
}

function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
}
</script>

<template>
    <Popover v-if="isVisible" v-model:open="open">
        <PopoverTrigger as="div">
            <TooltipWrapper :show-tooltip="showTooltip">
                <Toggle
                    v-bind="delegatedProps"
                    :aria-label="label"
                    class="gap-0.5 text-editor-toolbar-foreground"
                    :disabled="isDisabled"
                    :model-value="open"
                    size="default"
                >
                    <slot>
                        <ListChevronsUpDownIcon />
                        <ChevronDownIcon class="size-3" />
                    </slot>
                </Toggle>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </PopoverTrigger>

        <PopoverContent align="start" class="w-auto p-1" @close-auto-focus="handleCloseAutoFocus">
            <LineHeightGroup
                :editor="editor"
                :hide-when-unavailable="hideWhenUnavailable"
                :orientation="orientation"
                @update:changed="handleChanged"
            />
        </PopoverContent>
    </Popover>
</template>
