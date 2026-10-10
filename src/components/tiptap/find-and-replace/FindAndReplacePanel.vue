<script setup lang="ts">
import type { FindAndReplacePanelProps } from '.';

import {
    ArrowDownIcon,
    ArrowUpIcon,
    CaseSensitiveIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    RegexIcon,
    ReplaceAllIcon,
    ReplaceIcon,
    WholeWordIcon,
    XIcon,
} from '@lucide/vue';
import { isMacOS } from '@tiptap/vue-3';
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';

import { ButtonGroup } from '@/components/ui/button-group';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

import FindAndReplacePanelButton from './FindAndReplacePanelButton.vue';
import FindAndReplacePanelToggle from './FindAndReplacePanelToggle.vue';
import { useFindAndReplace } from './use-find-and-replace';

const props = withDefaults(defineProps<FindAndReplacePanelProps>(), {
    open: false,
    hideWhenUnavailable: false,
    enableShortcut: true,
    autoFocusSearch: true,
});

const emits = defineEmits<{
    'update:open': [open: boolean];
    'update:replaced': [];
    'update:replacedAll': [];
}>();

const panel = useTemplateRef<HTMLElement>('panel');
const replaceExpanded = ref(false);

const {
    isVisible,
    isAvailable,
    searchTerm,
    replaceTerm,
    caseSensitive,
    wholeWord,
    useRegex,
    resultCountLabel,
    canNavigate,
    canReplace,
    canReplaceAll,
    setSearchTerm,
    setReplaceTerm,
    toggleCaseSensitive,
    toggleWholeWord,
    toggleUseRegex,
    goToNext,
    goToPrevious,
    replaceCurrent,
    replaceAll,
    applySearch,
    suspendSearch,
} = useFindAndReplace({
    editor: () => props.editor,
    hideWhenUnavailable: () => props.hideWhenUnavailable,
    scrollIntoViewOptions: () => props.scrollIntoViewOptions,
    onReplaced: () => emits('update:replaced'),
    onReplacedAll: () => emits('update:replacedAll'),
});

watch(
    [() => props.open, isAvailable],
    ([open, available]) => {
        if (open && available) {
            applySearch();
            if (props.autoFocusSearch) {
                focusSearchInput();
            }
        } else if (!open) {
            suspendSearch();
        }
    },
    { immediate: true },
);

onMounted(() => document.addEventListener('keydown', handleGlobalShortcut));
onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleGlobalShortcut);
    suspendSearch();
});

function focusSearchInput() {
    nextTick(() => {
        const input = panel.value?.querySelector<HTMLInputElement>('[data-field=search-query]');
        input?.focus();
        input?.select();
    });
}

function setOpen(open: boolean) {
    emits('update:open', open);
}

function closePanel() {
    setOpen(false);
}

function handleGlobalShortcut(event: KeyboardEvent) {
    const modKey = isMacOS() ? event.metaKey : event.ctrlKey;
    if (
        !props.enableShortcut ||
        !isAvailable.value ||
        event.defaultPrevented ||
        event.isComposing ||
        !modKey ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== 'f'
    ) {
        return;
    }

    event.preventDefault();
    if (props.open) {
        focusSearchInput();
    } else {
        setOpen(true);
    }
}

function handleSearchKeydown(event: KeyboardEvent) {
    if (event.isComposing) {
        return;
    }

    if (event.key === 'Enter' && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        if (event.shiftKey) {
            goToPrevious();
        } else {
            goToNext();
        }
        return;
    }

    if (
        event.key === 'ArrowDown' &&
        !event.shiftKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey
    ) {
        event.preventDefault();
        goToNext();
        return;
    }

    if (
        event.key === 'ArrowUp' &&
        !event.shiftKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey
    ) {
        event.preventDefault();
        goToPrevious();
        return;
    }
}

function handleReplaceKeydown(event: KeyboardEvent) {
    if (
        event.key === 'Enter' &&
        !event.isComposing &&
        !event.shiftKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey
    ) {
        event.preventDefault();
        replaceCurrent();
    }
}

function handlePanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        closePanel();
    }
}
</script>

<template>
    <div
        v-if="isVisible"
        v-show="open"
        ref="panel"
        aria-label="Find and replace"
        :class="
            cn(
                'absolute top-11 right-2 z-30 w-md max-w-[calc(100%-1rem)] rounded-md border p-1.5 shadow-xs',
                'border-popup-border bg-popup-background text-popup-foreground',
                props.class,
            )
        "
        role="dialog"
        @keydown="handlePanelKeydown"
    >
        <div class="flex items-center gap-1">
            <FindAndReplacePanelButton
                :aria-expanded="replaceExpanded"
                label="Toggle replace"
                @click="replaceExpanded = !replaceExpanded"
            >
                <ChevronDownIcon v-if="replaceExpanded" />
                <ChevronRightIcon v-else />
            </FindAndReplacePanelButton>

            <InputGroup class="h-7 flex-1">
                <InputGroupInput
                    autocapitalize="off"
                    autocomplete="off"
                    autocorrect="off"
                    class="h-7"
                    data-field="search-query"
                    :disabled="!isAvailable"
                    :model-value="searchTerm"
                    placeholder="Find"
                    :spellcheck="false"
                    type="text"
                    @keydown="handleSearchKeydown"
                    @update:model-value="setSearchTerm"
                />

                <InputGroupAddon align="inline-end" class="gap-0 pr-0.5">
                    <FindAndReplacePanelToggle
                        :disabled="!isAvailable"
                        label="Match case"
                        :model-value="caseSensitive"
                        @update:model-value="toggleCaseSensitive"
                    >
                        <CaseSensitiveIcon />
                    </FindAndReplacePanelToggle>

                    <FindAndReplacePanelToggle
                        :disabled="!isAvailable"
                        label="Match whole word"
                        :model-value="wholeWord"
                        @update:model-value="toggleWholeWord"
                    >
                        <WholeWordIcon />
                    </FindAndReplacePanelToggle>

                    <FindAndReplacePanelToggle
                        :disabled="!isAvailable"
                        label="Use regular expression"
                        :model-value="useRegex"
                        @update:model-value="toggleUseRegex"
                    >
                        <RegexIcon />
                    </FindAndReplacePanelToggle>
                </InputGroupAddon>
            </InputGroup>

            <span
                aria-live="polite"
                class="w-12 shrink-0 text-center text-xs font-normal tabular-nums"
            >
                {{ resultCountLabel }}
            </span>

            <ButtonGroup spacing="spaced">
                <FindAndReplacePanelButton
                    :disabled="!canNavigate"
                    label="Previous match"
                    @click="goToPrevious"
                >
                    <ArrowUpIcon />
                </FindAndReplacePanelButton>

                <FindAndReplacePanelButton
                    :disabled="!canNavigate"
                    label="Next match"
                    @click="goToNext"
                >
                    <ArrowDownIcon />
                </FindAndReplacePanelButton>

                <FindAndReplacePanelButton
                    label="Close find and replace"
                    tooltip="Close"
                    @click="closePanel"
                >
                    <XIcon />
                </FindAndReplacePanelButton>
            </ButtonGroup>
        </div>

        <div v-show="replaceExpanded" class="mt-1 flex items-center gap-1 pl-8">
            <InputGroup class="h-7 flex-1">
                <InputGroupInput
                    autocapitalize="off"
                    autocomplete="off"
                    autocorrect="off"
                    class="h-7"
                    data-field="replace-query"
                    :disabled="!isAvailable"
                    :model-value="replaceTerm"
                    placeholder="Replace"
                    :spellcheck="false"
                    type="text"
                    @keydown="handleReplaceKeydown"
                    @update:model-value="setReplaceTerm"
                />
            </InputGroup>

            <ButtonGroup spacing="spaced">
                <FindAndReplacePanelButton
                    :disabled="!canReplace"
                    label="Replace current match"
                    tooltip="Replace"
                    @click="replaceCurrent"
                >
                    <ReplaceIcon />
                </FindAndReplacePanelButton>

                <FindAndReplacePanelButton
                    :disabled="!canReplaceAll"
                    label="Replace all matches"
                    tooltip="Replace all"
                    @click="replaceAll"
                >
                    <ReplaceAllIcon />
                </FindAndReplacePanelButton>
            </ButtonGroup>
        </div>
    </div>
</template>
