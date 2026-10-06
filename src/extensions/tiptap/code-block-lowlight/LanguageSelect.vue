<script setup lang="ts">
import type { CodeBlockLanguageOption } from './languages';

import { CheckIcon, ChevronsUpDownIcon } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxAnchor,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxList,
    ComboboxTrigger,
} from '@/components/ui/combobox';
import { ScrollArea } from '@/components/ui/scroll-area';

import { formatCodeBlockLanguage } from './languages';

const props = withDefaults(
    defineProps<{
        currentLanguage?: string | null;
        languages?: CodeBlockLanguageOption[];
        disabled?: boolean;
    }>(),
    {
        currentLanguage: 'plaintext',
        languages: () => [],
        disabled: false,
    },
);

const emits = defineEmits<{
    'update:selected': [language: string];
}>();

const open = ref(false);
const selectedLanguage = computed({
    get: () => props.currentLanguage ?? 'plaintext',
    set: (language: string) => {
        if (language !== props.currentLanguage) {
            emits('update:selected', language);
        }
    },
});

const selectedLabel = computed(
    () =>
        props.languages.find((language) => language.value === props.currentLanguage)?.label ??
        formatCodeBlockLanguage(props.currentLanguage ?? 'plaintext'),
);
</script>

<template>
    <Combobox v-model="selectedLanguage" v-model:open="open" :disabled="disabled">
        <ComboboxAnchor class="w-auto select-none">
            <ComboboxTrigger as="div" class="flex h-6 items-center justify-center">
                <Button
                    aria-label="Code block language"
                    :class="[
                        'h-6 gap-1 px-1.5 font-code text-xs text-muted-foreground',
                        open &&
                            'bg-active text-active-foreground hover:bg-active hover:text-active-foreground',
                    ]"
                    :disabled="disabled"
                    size="default"
                    type="button"
                    variant="ghost"
                >
                    <span>{{ selectedLabel }}</span>
                    <ChevronsUpDownIcon class="size-3" />
                </Button>
            </ComboboxTrigger>
        </ComboboxAnchor>

        <ComboboxList align="end" class="z-30 w-56 p-1 font-code">
            <ComboboxInput
                aria-label="Search code block languages"
                autocomplete="off"
                class="h-6 py-0 text-xs"
                :display-value="() => ''"
                placeholder="Search languages"
                :spellcheck="false"
            />

            <ScrollArea
                :class="[
                    'mt-1 h-72',
                    '[&_[data-slot=scroll-area-viewport]>div]:min-h-0',
                    '[&_[data-slot=scroll-area-viewport]>div]:content-start',
                    '[&_[data-slot=scroll-area-viewport]>div]:gap-0.5',
                    '[&_[data-slot=scroll-area-viewport]>div]:pr-2',
                ]"
            >
                <ComboboxEmpty class="px-2 py-6 text-muted-foreground">
                    No languages found
                </ComboboxEmpty>

                <ComboboxItem
                    v-for="language in languages"
                    :key="language.value"
                    :class="[
                        'h-6 w-full min-w-0 justify-start gap-1 px-1.5 text-xs font-normal whitespace-nowrap',
                        'text-muted-foreground data-highlighted:text-hover-foreground data-[state=checked]:text-active-foreground',
                    ]"
                    :text-value="`${language.label} ${language.value}`"
                    :value="language.value"
                >
                    <span class="min-w-0 flex-1 truncate">{{ language.label }}</span>
                    <ComboboxItemIndicator class="shrink-0">
                        <CheckIcon class="size-3" />
                    </ComboboxItemIndicator>
                </ComboboxItem>
            </ScrollArea>
        </ComboboxList>
    </Combobox>
</template>
