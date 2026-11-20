<script setup lang="ts">
import type { TextColorPopoverProps, TextColorPresetValue } from '.';

import { CirclePlusIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed, ref, useId, watch } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';
import { ColorPicker, ColorPopover, ColorSwatch } from '@/components/ui/color';
import { Separator } from '@/components/ui/separator';

import TextColorGroup from './TextColorGroup.vue';
import { useTextColor } from './use-text-color';

const props = withDefaults(defineProps<TextColorPopoverProps>(), {
    variant: 'default',
    showTooltip: true,
    hideWhenUnavailable: false,
});

const emits = defineEmits<{ 'update:changed': [choice: TextColorPresetValue | string | null] }>();

const open = ref(false);
const customOpen = ref(false);
const initialCustomColor = ref<string>();
const customPickerId = useId();

const {
    control,
    isHighlight,
    presets,
    activePreset,
    selectedChoice,
    selectedPreset,
    selectedColor,
    isActive,
    canSet,
    canRemove,
    isVisible,
    resolveTextColor,
    changeColor: updateColor,
    toggleSelectedColor,
} = useTextColor({
    editor: () => props.editor,
    type: () => props.type,
    presets: () => props.presets,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
});

const isDisabled = computed(() => !!props.disabled || !canSet.value);

watch(open, (isOpen) => {
    if (!isOpen) {
        customOpen.value = false;
    }
});

watch(
    () => props.type,
    () => {
        open.value = false;
        customOpen.value = false;
    },
);

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'type',
    'presets',
    'hideWhenUnavailable',
    'showTooltip',
);

function changeColor(choice: TextColorPresetValue | string | null) {
    if (!updateColor(choice)) {
        return false;
    }

    emits('update:changed', choice);
    return true;
}

function handleToggleColor() {
    const choice = toggleSelectedColor();

    if (choice !== undefined) {
        emits('update:changed', choice);
    }
}

function selectColor(choice: TextColorPresetValue | string, closeAfterApply: () => void) {
    if (changeColor(choice)) {
        closeAfterApply();
    }
}

function toggleCustomPicker() {
    if (customOpen.value) {
        customOpen.value = false;
        return;
    }

    initialCustomColor.value = resolveTextColor(selectedColor.value);
    customOpen.value = true;
}
</script>

<template>
    <ColorPopover
        v-if="isVisible"
        v-model:open="open"
        :active="isActive"
        :button-props="delegatedProps"
        :can-remove="canRemove"
        :disabled="isDisabled"
        :label="control.label"
        :palette-label="control.paletteLabel"
        :remove-color="() => changeColor(null)"
        :remove-label="`Remove ${control.label.toLowerCase()}`"
        :show-tooltip="showTooltip"
        :toggle-disabled="!selectedChoice"
        @toggle="handleToggleColor"
    >
        <template #trigger>
            <slot>
                <span aria-hidden="true" class="flex flex-col items-center">
                    <component :is="control.icon" class="size-3.5" />
                    <ColorSwatch
                        as="span"
                        class="h-0.5 w-4 rounded-none"
                        :class="{
                            'text-editor-foreground': type === 'color',
                            'text-editor-background': type === 'backgroundColor',
                        }"
                        :color="selectedColor ?? 'currentColor'"
                        :label="selectedPreset?.label"
                        :style="{ color: selectedPreset?.textColor }"
                    />
                </span>
            </slot>
        </template>

        <template #presets="{ closeAfterApply }">
            <TextColorGroup
                :active-preset="activePreset"
                :aria-label="`${control.label} presets`"
                :disabled="isDisabled"
                :presets="presets"
                :show-tooltip="showTooltip"
                @select="selectColor($event, closeAfterApply)"
            />
        </template>

        <template v-if="!isHighlight" #actions>
            <TooltipWrapper :show-tooltip="showTooltip">
                <Button
                    :aria-controls="customOpen ? customPickerId : undefined"
                    :aria-expanded="customOpen"
                    aria-label="Add custom color"
                    class="text-editor-toolbar-foreground"
                    :disabled="isDisabled"
                    size="icon"
                    variant="ghost"
                    @click="toggleCustomPicker"
                    @mousedown.prevent
                >
                    <CirclePlusIcon />
                </Button>

                <template #tooltip>Add custom color</template>
            </TooltipWrapper>
        </template>

        <template v-if="!isHighlight" #details="{ closeAfterApply }">
            <div v-if="customOpen" :id="customPickerId" class="contain-[inline-size]">
                <Separator class="my-1" />

                <ColorPicker
                    class="p-1"
                    :disabled="isDisabled"
                    :initial-color="initialCustomColor"
                    @select="selectColor($event, closeAfterApply)"
                />
            </div>
        </template>
    </ColorPopover>
</template>
