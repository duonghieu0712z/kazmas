<script setup lang="ts">
import type { ToggleProps } from '@/components/ui/toggle';
import type { ComponentPublicInstance } from 'vue';

import { ChevronDownIcon, EraserIcon } from '@lucide/vue';
import { ref, useId, useTemplateRef, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const props = defineProps<{
    label: string;
    paletteLabel: string;
    removeLabel: string;
    showTooltip: boolean;
    disabled: boolean;
    active: boolean;
    toggleDisabled?: boolean;
    canRemove: boolean;
    buttonProps: Omit<ToggleProps, 'modelValue' | 'size'>;
    removeColor: () => boolean;
}>();

const emits = defineEmits<{ toggle: [] }>();

const open = defineModel<boolean>('open', { default: false });
const tooltipOpen = ref(false);
const popupId = useId();
const paletteTrigger = useTemplateRef<ComponentPublicInstance>('paletteTrigger');

let applied = false;
let restoreTriggerFocus = false;

watch(
    () => props.disabled,
    (disabled) => {
        if (disabled) {
            open.value = false;
        }
    },
);

watch(open, (isOpen) => {
    if (isOpen) {
        tooltipOpen.value = false;
    }
});

function closeAfterApply() {
    applied = true;
    open.value = false;
}

function handleRemove() {
    if (props.removeColor()) {
        closeAfterApply();
    }
}

function handlePaletteClick() {
    restoreTriggerFocus = open.value;
}

function handleEscapeKeyDown() {
    restoreTriggerFocus = true;
}

function handleCloseAutoFocus(event: Event) {
    if (applied) {
        event.preventDefault();
    } else if (restoreTriggerFocus) {
        event.preventDefault();

        const trigger = paletteTrigger.value?.$el;

        if (trigger instanceof HTMLElement) {
            trigger.focus();
        }
    }

    applied = false;
    restoreTriggerFocus = false;
}
</script>

<template>
    <Popover v-model:open="open">
        <PopoverAnchor>
            <Tooltip v-model:open="tooltipOpen" :disabled="open || !showTooltip || undefined">
                <TooltipTrigger>
                    <ButtonGroup
                        :aria-label="`${label} controls`"
                        :class="[
                            'items-center rounded-sm px-2',
                            'text-muted-foreground',
                            'hover:bg-hover hover:text-hover-foreground',
                            'data-[state=on]:bg-selected data-[state=on]:text-selected-foreground',
                            'data-disabled:pointer-events-none data-disabled:text-disabled-foreground',
                        ]"
                        :data-disabled="disabled ? '' : undefined"
                        :data-state="open ? 'on' : 'off'"
                        spacing="spaced"
                    >
                        <Toggle
                            v-bind="buttonProps"
                            :aria-label="label"
                            :class="[
                                'w-4 rounded-none p-0 text-inherit',
                                'hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit',
                                'data-[state=on]:bg-transparent data-[state=on]:text-inherit',
                            ]"
                            :disabled="disabled || toggleDisabled"
                            :model-value="active"
                            size="icon"
                            @click="emits('toggle')"
                            @mousedown.prevent
                        >
                            <slot name="trigger" />
                        </Toggle>

                        <PopoverTrigger>
                            <Toggle
                                ref="paletteTrigger"
                                :aria-controls="open ? popupId : undefined"
                                :aria-expanded="open"
                                aria-haspopup="dialog"
                                :aria-label="paletteLabel"
                                :class="[
                                    'w-3 rounded-none p-0 text-inherit',
                                    'hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit',
                                    'data-[state=on]:bg-transparent data-[state=on]:text-inherit',
                                ]"
                                :disabled="disabled"
                                :model-value="open"
                                @click="handlePaletteClick"
                                @mousedown.prevent
                            >
                                <ChevronDownIcon class="size-3" />
                            </Toggle>
                        </PopoverTrigger>
                    </ButtonGroup>
                </TooltipTrigger>

                <TooltipContent side="bottom">{{ label }}</TooltipContent>
            </Tooltip>
        </PopoverAnchor>

        <PopoverContent
            :id="popupId"
            align="center"
            :aria-label="paletteLabel"
            class="w-auto p-1"
            @close-auto-focus="handleCloseAutoFocus"
            @escape-key-down="handleEscapeKeyDown"
        >
            <ButtonGroup
                class="items-center has-[>[data-slot=button-group]]:gap-0.5"
                spacing="spaced"
            >
                <slot :close-after-apply="closeAfterApply" name="presets" />

                <ButtonGroupSeparator class="my-1" />

                <Tooltip :disabled="!showTooltip || undefined">
                    <TooltipTrigger>
                        <Button
                            :aria-label="removeLabel"
                            class="text-muted-foreground"
                            :disabled="disabled || !canRemove"
                            size="icon"
                            variant="ghost"
                            @click="handleRemove"
                            @mousedown.prevent
                        >
                            <EraserIcon />
                        </Button>
                    </TooltipTrigger>

                    <TooltipContent side="bottom">{{ removeLabel }}</TooltipContent>
                </Tooltip>

                <slot name="actions" />
            </ButtonGroup>
            <slot :close-after-apply="closeAfterApply" name="details" />
        </PopoverContent>
    </Popover>
</template>
