<script setup lang="ts">
import type { FontSizeListProps } from '.';

import { computed, ref } from 'vue';

import {
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxSeparator,
} from '@/components/ui/combobox';
import { ScrollArea } from '@/components/ui/scroll-area';

const props = defineProps<FontSizeListProps>();

const input = ref('');

const numericOptions = computed(() => {
    const sizes = new Set(props.sizes.filter((size) => Number.isFinite(size) && size > 0));

    if (props.activeFontSize?.endsWith('px')) {
        const size = Number.parseFloat(props.activeFontSize);

        if (Number.isFinite(size) && size > 0) {
            sizes.add(size);
        }
    }

    return [...sizes].sort((left, right) => left - right);
});

const customSize = computed(() => {
    const value = input.value.trim();

    if (!/^\d+(?:\.\d+)?$/.test(value)) {
        return null;
    }

    const size = Number(value);

    return Number.isFinite(size) && size > 0 ? size : null;
});

const options = computed(() => {
    if (customSize.value !== null) {
        return [{ label: String(customSize.value), value: `${customSize.value}px` }];
    }

    if (input.value.trim()) {
        return [];
    }

    return numericOptions.value.map((size) => ({ label: String(size), value: `${size}px` }));
});
</script>

<template>
    <ComboboxList align="start" aria-label="Font size" class="w-24" :side-offset="2">
        <ComboboxInput
            v-model="input"
            aria-label="Font size in pixels"
            autocomplete="off"
            class="h-6 py-0 text-xs"
            :display-value="() => ''"
            inputmode="decimal"
            placeholder="Size"
            :show-search-icon="false"
            :spellcheck="false"
        />

        <ScrollArea
            :class="[
                'h-60 max-h-[calc(var(--reka-combobox-content-available-height)-2.75rem)] p-1',
                `[&_[data-slot='scroll-area-viewport']>div]:min-h-0 [&_[data-slot='scroll-area-viewport']>div]:content-start`,
                `[&_[data-slot='scroll-area-viewport']>div]:gap-0.5 [&_[data-slot='scroll-area-viewport']>div]:pr-2`,
            ]"
        >
            <template v-if="!input.trim()">
                <ComboboxItem
                    class="h-6 rounded-xs py-0 text-xs font-normal text-editor-toolbar-foreground"
                    :text-value="defaultLabel"
                    :value="null"
                >
                    {{ defaultLabel }}
                </ComboboxItem>

                <ComboboxSeparator class="my-1" />
            </template>

            <ComboboxItem
                v-for="option in options"
                :key="option.label"
                class="h-6 rounded-xs py-0 text-xs font-normal text-editor-toolbar-foreground"
                :text-value="option.label"
                :value="option.value"
            >
                {{ option.label }}
            </ComboboxItem>

            <p
                v-if="input.trim() && customSize === null"
                class="px-2 py-2 text-xs text-disabled-foreground"
                role="status"
            >
                Enter a positive number
            </p>
        </ScrollArea>
    </ComboboxList>
</template>
