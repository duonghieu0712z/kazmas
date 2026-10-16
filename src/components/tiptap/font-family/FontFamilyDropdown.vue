<script setup lang="ts">
import type { FontFamilyDropdownProps } from '.';

import { ChevronDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Combobox, ComboboxAnchor, ComboboxTrigger } from '@/components/ui/combobox';
import { Toggle } from '@/components/ui/toggle';

import FontFamilyList from './FontFamilyList.vue';
import { useFontFamily } from './use-font-family';

const props = withDefaults(defineProps<FontFamilyDropdownProps>(), {
    variant: 'default',
    fonts: () => [],
    loading: false,
    error: false,
    showTooltip: true,
    hideWhenUnavailable: false,
});

const emits = defineEmits<{
    'update:changed': [fontFamily: string | null];
    'update:open': [open: boolean];
    retry: [];
}>();

const open = ref(false);

const {
    activeFontFamily,
    defaultFontFamily,
    defaultLabel,
    canSet,
    isVisible,
    label,
    handleFontFamily,
} = useFontFamily({
    editor: () => props.editor,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
    onChanged: (fontFamily) => emits('update:changed', fontFamily),
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
    'fonts',
    'loading',
    'error',
    'showTooltip',
    'hideWhenUnavailable',
);

function changeFontFamily(value: unknown) {
    if (typeof value !== 'string' && value !== null) {
        return;
    }

    if (handleFontFamily(value)) {
        open.value = false;
    }
}
</script>

<template>
    <Combobox
        v-if="isVisible"
        v-model:open="open"
        :disabled="isDisabled"
        :model-value="activeFontFamily"
        @update:model-value="changeFontFamily"
    >
        <ComboboxAnchor class="w-auto">
            <ComboboxTrigger as="div">
                <TooltipWrapper :show-tooltip="showTooltip">
                    <Toggle
                        v-bind="delegatedProps"
                        aria-label="Font family"
                        class="w-30 shrink-0 justify-between gap-0.5 text-editor-toolbar-foreground"
                        :disabled="isDisabled"
                        :model-value="open"
                        size="default"
                        @mousedown.prevent
                    >
                        <slot>
                            <span
                                class="min-w-0 flex-1 truncate text-left"
                                :style="{
                                    fontFamily:
                                        activeFontFamily === null ? defaultFontFamily : undefined,
                                }"
                            >
                                {{ label }}
                            </span>
                            <ChevronDownIcon class="size-3" />
                        </slot>
                    </Toggle>

                    <template #tooltip>Font family</template>
                </TooltipWrapper>
            </ComboboxTrigger>
        </ComboboxAnchor>

        <FontFamilyList
            :active-font-family="activeFontFamily"
            :default-font-family="defaultFontFamily"
            :default-label="defaultLabel"
            :error="error"
            :fonts="fonts"
            :loading="loading"
            @retry="emits('retry')"
        />
    </Combobox>
</template>
