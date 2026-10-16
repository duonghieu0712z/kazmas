<script setup lang="ts">
import type { TextStyleColorPopoverProps } from '.';

import { ChevronDownIcon, EraserIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { ColorPicker, ColorSwatch } from '@/components/ui/color';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';

import { getColorHex } from './colors';
import { useTextStyleColor } from './use-text-style-color';

const props = withDefaults(defineProps<TextStyleColorPopoverProps>(), {
    variant: 'default',
    showTooltip: true,
    hideWhenUnavailable: false,
});

const emits = defineEmits<{ 'update:changed': [color: string | null] }>();

const open = ref(false);
const customColor = ref('#000000');
let applied = false;

const {
    editor,
    presets,
    activeColor,
    activePreset,
    canSet,
    canRemove,
    isVisible,
    label,
    icon,
    handleColor,
} = useTextStyleColor({
    editor: () => props.editor,
    type: () => props.type,
    presets: () => props.presets,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
});

const isDisabled = computed(() => !!props.disabled || !canSet.value);

watch(open, (value) => {
    if (!value || !editor.value) {
        return;
    }

    const initialColor = activeColor.value ?? presets.value[0]?.color ?? 'currentColor';
    customColor.value = getColorHex(initialColor, editor.value.view.dom);
});

watch(isDisabled, (disabled) => {
    if (disabled) {
        open.value = false;
    }
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'type',
    'presets',
    'hideWhenUnavailable',
    'showTooltip',
);

function handleChanged(color: string | null) {
    if (handleColor(color)) {
        applied = true;
        open.value = false;
        emits('update:changed', color);
    }
}

function handleCloseAutoFocus(event: Event) {
    if (applied) {
        event.preventDefault();
    }

    applied = false;
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
                    :model-value="open || !!activeColor"
                    size="default"
                >
                    <slot>
                        <span aria-hidden="true" class="flex flex-col items-center">
                            <component
                                :is="icon"
                                :class="
                                    type === 'color'
                                        ? 'size-4 [&>path:first-child]:stroke-(--text-style-color)'
                                        : 'size-3.5'
                                "
                                :style="{ '--text-style-color': activeColor || 'currentColor' }"
                            />
                            <ColorSwatch
                                v-if="type === 'backgroundColor'"
                                as="span"
                                class="h-0.5 w-4 rounded-none"
                                :color="activeColor || 'currentColor'"
                            />
                        </span>
                        <ChevronDownIcon class="size-3" />
                    </slot>
                </Toggle>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </PopoverTrigger>

        <PopoverContent
            align="center"
            :aria-label="label"
            class="w-56 p-1"
            @close-auto-focus="handleCloseAutoFocus"
        >
            <ButtonGroup :aria-label="`${label} presets`" spacing="spaced">
                <TooltipWrapper
                    v-for="preset in presets"
                    :key="preset.color"
                    :show-tooltip="showTooltip"
                >
                    <Toggle
                        :aria-label="preset.label"
                        :disabled="isDisabled"
                        :model-value="activePreset?.color === preset.color"
                        size="icon"
                        @click="handleChanged(preset.color)"
                        @mousedown.prevent
                    >
                        <ColorSwatch aria-hidden="true" as="span" :color="preset.color" />
                    </Toggle>

                    <template #tooltip>{{ preset.label }}</template>
                </TooltipWrapper>

                <ButtonGroupSeparator class="my-1" />

                <TooltipWrapper :show-tooltip="showTooltip">
                    <Button
                        :aria-label="`Remove ${label.toLowerCase()}`"
                        class="text-editor-toolbar-foreground"
                        :disabled="isDisabled || !canRemove"
                        size="icon"
                        variant="ghost"
                        @click="handleChanged(null)"
                        @mousedown.prevent
                    >
                        <EraserIcon />
                    </Button>

                    <template #tooltip>Remove {{ label.toLowerCase() }}</template>
                </TooltipWrapper>
            </ButtonGroup>

            <Separator class="my-1" />

            <ColorPicker
                v-model="customColor"
                class="p-1"
                :disabled="isDisabled"
                @select="handleChanged"
            />
        </PopoverContent>
    </Popover>
</template>
