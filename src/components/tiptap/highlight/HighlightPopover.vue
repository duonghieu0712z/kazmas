<script setup lang="ts">
import type { HighlightPopoverProps } from '.';
import type { HighlightPresetValue } from './presets';
import type { ComponentPublicInstance } from 'vue';

import { ChevronDownIcon, EraserIcon, HighlighterIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed, ref, useId, useTemplateRef, watch } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { ColorSwatch } from '@/components/ui/color';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { getHighlightPresetStyle } from '@/lib/highlight';

import HighlightGroup from './HighlightGroup.vue';
import { HIGHLIGHT_PRESETS } from './presets';
import { useHighlight } from './use-highlight';

const props = withDefaults(defineProps<HighlightPopoverProps>(), {
    variant: 'default',
    showTooltip: true,
    hideWhenUnavailable: false,
});

const emits = defineEmits<{
    'update:highlighted': [preset: HighlightPresetValue];
    'update:highlightRemoved': [];
}>();

const open = ref(false);
const selectedPresetId = ref<string>();
const popupId = useId();
const paletteTrigger = useTemplateRef<ComponentPublicInstance>('paletteTrigger');

let applied = false;
let restoreTriggerFocus = false;

const {
    presets,
    activePreset,
    canHighlight,
    canRemoveHighlight,
    isVisible,
    handleUnsetHighlight,
    handleToggleHighlight,
} = useHighlight({
    editor: () => props.editor,
    presets: () => props.presets,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
});

const selectedPreset = computed(
    () =>
        presets.value.find((preset) => preset.id === selectedPresetId.value) ??
        presets.value[0] ??
        HIGHLIGHT_PRESETS[0]!,
);

const isDisabled = computed(() => !!props.disabled || !canHighlight.value);
const isSelectedPresetActive = computed(() => activePreset.value?.id === selectedPreset.value.id);

watch(
    activePreset,
    (preset) => {
        if (preset) {
            selectedPresetId.value = preset.id;
        }
    },
    { immediate: true },
);

watch(isDisabled, (disabled) => {
    if (disabled) {
        open.value = false;
    }
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'presets',
    'showTooltip',
    'hideWhenUnavailable',
);

function handleHighlighted(preset: HighlightPresetValue) {
    selectedPresetId.value = preset.id;
    applied = true;
    open.value = false;
    emits('update:highlighted', preset);
}

function toggleSelectedHighlight() {
    const wasActive = isSelectedPresetActive.value;

    if (!handleToggleHighlight(selectedPreset.value)) {
        return;
    }

    if (wasActive) {
        emits('update:highlightRemoved');
    } else {
        emits('update:highlighted', selectedPreset.value);
    }
}

function removeHighlight() {
    if (handleUnsetHighlight()) {
        applied = true;
        open.value = false;
        emits('update:highlightRemoved');
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
    <Popover v-if="isVisible" v-model:open="open">
        <PopoverAnchor>
            <TooltipWrapper :show-tooltip="showTooltip">
                <ButtonGroup
                    aria-label="Highlight controls"
                    :class="[
                        'items-center rounded-sm px-2',
                        'text-editor-toolbar-foreground',
                        'hover:bg-hover hover:text-hover-foreground',
                        'data-[state=on]:bg-selected data-[state=on]:text-selected-foreground',
                        'data-disabled:pointer-events-none data-disabled:text-disabled-foreground',
                    ]"
                    :data-disabled="isDisabled ? '' : undefined"
                    :data-state="isSelectedPresetActive || open ? 'on' : 'off'"
                    spacing="spaced"
                >
                    <Toggle
                        v-bind="delegatedProps"
                        aria-label="Highlight"
                        :class="[
                            'w-4 rounded-none p-0 text-inherit',
                            'hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit',
                            'data-[state=on]:bg-transparent data-[state=on]:text-inherit',
                        ]"
                        :disabled="isDisabled"
                        :model-value="isSelectedPresetActive"
                        size="icon"
                        @click="toggleSelectedHighlight"
                        @mousedown.prevent
                    >
                        <span aria-hidden="true" class="flex flex-col items-center">
                            <HighlighterIcon class="size-3.5" />
                            <ColorSwatch
                                as="span"
                                class="h-0.5 w-4 rounded-none"
                                :color="selectedPreset.backgroundColor"
                                :label="selectedPreset.label"
                                :style="getHighlightPresetStyle(selectedPreset)"
                            />
                        </span>
                    </Toggle>

                    <PopoverTrigger>
                        <Toggle
                            ref="paletteTrigger"
                            :aria-controls="open ? popupId : undefined"
                            :aria-expanded="open"
                            aria-haspopup="dialog"
                            aria-label="Highlight colors"
                            :class="[
                                'w-3 rounded-none p-0 text-inherit',
                                'hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit',
                                'data-[state=on]:bg-transparent data-[state=on]:text-inherit',
                            ]"
                            :disabled="isDisabled"
                            :model-value="open"
                            @click="handlePaletteClick"
                            @mousedown.prevent
                        >
                            <ChevronDownIcon class="size-3" />
                        </Toggle>
                    </PopoverTrigger>
                </ButtonGroup>

                <template #tooltip>Highlight</template>
            </TooltipWrapper>
        </PopoverAnchor>

        <PopoverContent
            :id="popupId"
            align="center"
            aria-label="Highlight"
            class="w-auto p-1"
            @close-auto-focus="handleCloseAutoFocus"
            @escape-key-down="handleEscapeKeyDown"
        >
            <ButtonGroup
                class="items-center has-[>[data-slot=button-group]]:gap-0.5"
                spacing="spaced"
            >
                <HighlightGroup
                    :editor="editor"
                    :presets="presets"
                    @update:highlighted="handleHighlighted"
                />

                <ButtonGroupSeparator class="my-1" />

                <TooltipWrapper :show-tooltip="showTooltip">
                    <Button
                        aria-label="Remove highlight"
                        class="text-editor-toolbar-foreground"
                        :disabled="!canRemoveHighlight || props.disabled"
                        size="icon"
                        variant="ghost"
                        @click="removeHighlight"
                        @mousedown.prevent
                    >
                        <EraserIcon />
                    </Button>

                    <template #tooltip>Remove highlight</template>
                </TooltipWrapper>
            </ButtonGroup>
        </PopoverContent>
    </Popover>
</template>
