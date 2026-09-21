<script setup lang="ts">
import type { CodeBlockLanguageOption } from './languages';

import { CheckIcon, ChevronsUpDownIcon } from '@lucide/vue';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
const query = ref('');
let keepEditorFocus = false;

const selectedLabel = computed(
    () =>
        props.languages.find((language) => language.value === props.currentLanguage)?.label ??
        formatCodeBlockLanguage(props.currentLanguage ?? 'plaintext'),
);
const filteredLanguages = computed(() => {
    const normalizedQuery = query.value.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
        return props.languages;
    }

    return props.languages.filter(
        (language) =>
            language.label.toLocaleLowerCase().includes(normalizedQuery) ||
            language.value.toLocaleLowerCase().includes(normalizedQuery),
    );
});

watch(open, (isOpen) => {
    if (!isOpen) {
        query.value = '';
    }
});

function selectLanguage(language: string) {
    emits('update:selected', language);
    keepEditorFocus = true;
    open.value = false;
}

function handleCloseAutoFocus(event: Event) {
    if (keepEditorFocus) {
        event.preventDefault();
        keepEditorFocus = false;
    }
}
</script>

<template>
    <Popover v-model:open="open">
        <PopoverTrigger as="div">
            <Button
                aria-label="Code block language"
                class="h-7 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:text-foreground"
                :disabled="disabled"
                size="default"
                type="button"
                variant="ghost"
            >
                <span>{{ selectedLabel }}</span>
                <ChevronsUpDownIcon class="text-muted-foreground" />
            </Button>
        </PopoverTrigger>

        <PopoverContent align="end" class="w-64 p-1" @close-auto-focus="handleCloseAutoFocus">
            <Input
                v-model="query"
                aria-label="Search code block languages"
                autocomplete="off"
                placeholder="Search languages"
                :spellcheck="false"
                type="search"
            />

            <ScrollArea class="mt-1 h-72 [&_[data-slot=scroll-area-viewport]>div]:min-h-0">
                <div v-if="filteredLanguages.length" class="grid gap-0.5 pr-2" role="listbox">
                    <Button
                        v-for="language in filteredLanguages"
                        :key="language.value"
                        :aria-selected="currentLanguage === language.value"
                        class="w-full justify-start font-normal"
                        role="option"
                        type="button"
                        variant="ghost"
                        @click="selectLanguage(language.value)"
                    >
                        <CheckIcon
                            :class="
                                currentLanguage === language.value ? 'opacity-100' : 'opacity-0'
                            "
                        />
                        <span>{{ language.label }}</span>
                    </Button>
                </div>

                <div v-else class="px-2 py-6 text-center text-sm text-muted-foreground">
                    No languages found
                </div>
            </ScrollArea>
        </PopoverContent>
    </Popover>
</template>
