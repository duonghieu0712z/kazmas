<script setup lang="ts">
import type { FontSizeDropdownProps } from '.';

import { ChevronDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Combobox, ComboboxAnchor, ComboboxTrigger } from '@/components/ui/combobox';
import { Toggle } from '@/components/ui/toggle';

import FontSizeList from './FontSizeList.vue';
import { DEFAULT_FONT_SIZES, useFontSize } from './use-font-size';

const props = withDefaults(defineProps<FontSizeDropdownProps>(), {
    variant: 'default',
    sizes: () => DEFAULT_FONT_SIZES,
    showTooltip: true,
    hideWhenUnavailable: false,
});

const emits = defineEmits<{
    'update:changed': [fontSize: string | null];
    'update:open': [open: boolean];
}>();

const open = ref(false);

const { activeFontSize, defaultLabel, canSet, isVisible, label, handleFontSize } = useFontSize({
    editor: () => props.editor,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
    onChanged: (fontSize) => emits('update:changed', fontSize),
});

const isDisabled = computed(() => !!props.disabled || !canSet.value);

watch(open, (value) => emits('update:open', value));

watch(isDisabled, (disabled) => {
    if (disabled) {
        open.value = false;
    }
});

const delegatedProps = reactiveOmit(props, 'editor', 'sizes', 'showTooltip', 'hideWhenUnavailable');

function changeFontSize(value: unknown) {
    if (typeof value !== 'string' && value !== null) {
        return;
    }

    if (handleFontSize(value)) {
        open.value = false;
    }
}
</script>

<template>
    <Combobox
        v-if="isVisible"
        v-model:open="open"
        :disabled="isDisabled"
        :ignore-filter="true"
        :model-value="activeFontSize"
        @update:model-value="changeFontSize"
    >
        <ComboboxAnchor class="w-auto">
            <ComboboxTrigger as="div">
                <TooltipWrapper :show-tooltip="showTooltip">
                    <Toggle
                        v-bind="delegatedProps"
                        aria-label="Font size"
                        class="w-12 shrink-0 justify-between gap-0.5 text-editor-toolbar-foreground"
                        :disabled="isDisabled"
                        :model-value="open"
                        size="default"
                        @mousedown.prevent
                    >
                        <slot>
                            <span class="min-w-0 flex-1 truncate text-left">
                                {{ label }}
                            </span>
                            <ChevronDownIcon class="size-3" />
                        </slot>
                    </Toggle>

                    <template #tooltip>Font size</template>
                </TooltipWrapper>
            </ComboboxTrigger>
        </ComboboxAnchor>

        <FontSizeList
            :active-font-size="activeFontSize"
            :default-label="defaultLabel"
            :sizes="sizes"
        />
    </Combobox>
</template>
