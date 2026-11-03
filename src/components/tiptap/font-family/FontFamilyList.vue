<script setup lang="ts">
import type { FontFamilyListProps } from '.';

import { computed } from 'vue';

import { Button } from '@/components/ui/button';
import {
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxSeparator,
} from '@/components/ui/combobox';
import { ScrollArea } from '@/components/ui/scroll-area';

const props = withDefaults(defineProps<FontFamilyListProps>(), {
    fonts: () => [],
    loading: false,
    error: false,
});

const emits = defineEmits<{ retry: [] }>();

const menuFonts = computed(() => {
    const families = new Set(props.fonts);

    if (props.activeFontFamily) {
        families.add(props.activeFontFamily);
    }

    return [...families].sort((left, right) => left.localeCompare(right));
});
</script>

<template>
    <ComboboxList align="start" aria-label="Font family" class="w-50" :side-offset="2">
        <ComboboxInput
            aria-label="Search fonts"
            autocomplete="off"
            class="h-6 py-0 text-xs"
            :display-value="() => ''"
            placeholder="Search fonts"
            :spellcheck="false"
        />

        <ScrollArea
            :class="[
                'h-72 max-h-[calc(var(--reka-combobox-content-available-height)-2.75rem)] p-1',
                `[&_[data-slot='scroll-area-viewport']>div]:min-h-0 [&_[data-slot='scroll-area-viewport']>div]:content-start`,
                `[&_[data-slot='scroll-area-viewport']>div]:gap-0.5 [&_[data-slot='scroll-area-viewport']>div]:pr-2`,
            ]"
        >
            <ComboboxGroup class="p-0">
                <ComboboxItem
                    class="h-6 rounded-xs py-0 text-xs font-normal text-editor-toolbar-foreground"
                    :style="{ fontFamily: defaultFontFamily }"
                    :text-value="defaultLabel"
                    :value="null"
                >
                    {{ defaultLabel }}
                </ComboboxItem>

                <ComboboxSeparator class="my-1" />
            </ComboboxGroup>

            <p v-if="loading" class="px-2 py-2 text-xs text-disabled-foreground" role="status">
                Loading fonts…
            </p>

            <template v-else-if="error">
                <p class="px-2 py-2 text-xs text-disabled-foreground" role="status">
                    Unable to load fonts
                </p>

                <Button class="h-6 justify-start text-xs" variant="ghost" @click="emits('retry')">
                    Retry
                </Button>
            </template>

            <ComboboxEmpty v-else class="px-2 text-xs text-editor-toolbar-foreground">
                No fonts found
            </ComboboxEmpty>

            <ComboboxItem
                v-for="family in menuFonts"
                :key="family"
                class="h-6 min-w-0 rounded-xs py-0 text-xs font-normal text-editor-toolbar-foreground"
                :style="{ fontFamily: JSON.stringify(family) }"
                :text-value="family"
                :value="family"
            >
                <span class="min-w-0 flex-1 truncate">{{ family }}</span>
            </ComboboxItem>
        </ScrollArea>
    </ComboboxList>
</template>
