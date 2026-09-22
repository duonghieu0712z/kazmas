<script setup lang="ts">
import type { TextAlign, TextAlignPopoverProps } from '.';

import { ChevronDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

import TextAlignGroup from './TextAlignGroup.vue';
import { useTextAligns } from './use-text-aligns';

const props = withDefaults(defineProps<TextAlignPopoverProps>(), {
    variant: 'default',
    aligns: () => ['left', 'center', 'right', 'justify'],
    orientation: 'horizontal',
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:aligned': [align: TextAlign];
}>();

const open = ref(false);
const { canAlign, isVisible, label, icon } = useTextAligns({
    editor: props.editor,
    aligns: props.aligns,
    hideWhenUnavailable: props.hideWhenUnavailable,
});
const delegatedProps = reactiveOmit(
    props,
    'editor',
    'aligns',
    'orientation',
    'hideWhenUnavailable',
    'showTooltip',
);

function handleAligned(align: TextAlign) {
    open.value = false;
    emits('update:aligned', align);
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
                    class="gap-0.5"
                    :disabled="!canAlign"
                    :model-value="open"
                    size="default"
                >
                    <slot>
                        <component :is="icon" />
                        <ChevronDownIcon class="size-3 text-muted-foreground" />
                    </slot>
                </Toggle>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </PopoverTrigger>

        <PopoverContent align="start" class="w-auto p-1" @close-auto-focus="handleCloseAutoFocus">
            <TextAlignGroup
                :aligns="aligns"
                :editor="editor"
                :orientation="orientation"
                @update:aligned="handleAligned"
            />
        </PopoverContent>
    </Popover>
</template>
