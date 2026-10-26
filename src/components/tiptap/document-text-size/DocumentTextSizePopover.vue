<script setup lang="ts">
import type { DocumentTextSizePopoverProps } from '.';
import type { DocumentTextSizeValue } from '@/extensions/tiptap';

import { ChevronDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

import DocumentTextSizeGroup from './DocumentTextSizeGroup.vue';
import { useDocumentTextSize } from './use-document-text-size';

const props = withDefaults(defineProps<DocumentTextSizePopoverProps>(), {
    variant: 'default',
    orientation: 'horizontal',
    presetCount: 3,
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:changed': [textSize: DocumentTextSizeValue];
    'update:open': [open: boolean];
}>();

const open = ref(false);

const { canSet, isVisible, label } = useDocumentTextSize({
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
    'presetCount',
    'hideWhenUnavailable',
    'showTooltip',
);

function handleChanged(textSize: DocumentTextSizeValue) {
    open.value = false;
    emits('update:changed', textSize);
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
                        <span
                            aria-hidden="true"
                            class="inline-flex size-4 items-center justify-center text-base leading-none"
                        >
                            A
                        </span>
                        <ChevronDownIcon class="size-3" />
                    </slot>
                </Toggle>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </PopoverTrigger>

        <PopoverContent align="start" class="w-auto p-1" @close-auto-focus="handleCloseAutoFocus">
            <DocumentTextSizeGroup
                :editor="editor"
                :hide-when-unavailable="hideWhenUnavailable"
                :orientation="orientation"
                :preset-count="presetCount"
                @update:changed="handleChanged"
            />
        </PopoverContent>
    </Popover>
</template>
