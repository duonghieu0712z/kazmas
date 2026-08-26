<script setup lang="ts">
import type { FindAndReplacePanelProps } from '.';

import {
    CaseSensitiveIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    RegexIcon,
    ReplaceAllIcon,
    ReplaceIcon,
    WholeWordIcon,
    XIcon,
} from '@lucide/vue';
import { isMacOS } from '@tiptap/vue-3';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

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
    hasNoResults,
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
    editor: props.editor,
    hideWhenUnavailable: props.hideWhenUnavailable,
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
                'absolute top-11 right-2 z-40 w-lg max-w-[calc(100%-1rem)] rounded-sm border bg-popover p-1.5 text-popover-foreground shadow-md',
                props.class,
            )
        "
        role="dialog"
        @keydown="handlePanelKeydown"
    >
        <div class="flex items-center gap-1">
            <TooltipWrapper>
                <Button
                    :aria-expanded="replaceExpanded"
                    aria-label="Toggle replace"
                    class="size-7"
                    size="icon"
                    type="button"
                    variant="ghost"
                    @click="replaceExpanded = !replaceExpanded"
                >
                    <ChevronDownIcon v-if="replaceExpanded" />
                    <ChevronRightIcon v-else />
                </Button>

                <template #tooltip>Toggle replace</template>
            </TooltipWrapper>

            <InputGroup class="h-7 min-w-0 flex-1" :data-invalid="hasNoResults">
                <InputGroupInput
                    :aria-invalid="hasNoResults"
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
                    <span
                        aria-live="polite"
                        class="min-w-12 px-1 text-center text-xs font-normal tabular-nums"
                    >
                        {{ resultCountLabel }}
                    </span>

                    <TooltipWrapper>
                        <Toggle
                            aria-label="Match case"
                            class="size-6"
                            :disabled="!isAvailable"
                            :model-value="caseSensitive"
                            size="icon"
                            @update:model-value="toggleCaseSensitive"
                        >
                            <CaseSensitiveIcon />
                        </Toggle>

                        <template #tooltip>Match case</template>
                    </TooltipWrapper>

                    <TooltipWrapper>
                        <Toggle
                            aria-label="Match whole word"
                            class="size-6"
                            :disabled="!isAvailable"
                            :model-value="wholeWord"
                            size="icon"
                            @update:model-value="toggleWholeWord"
                        >
                            <WholeWordIcon />
                        </Toggle>

                        <template #tooltip>Match whole word</template>
                    </TooltipWrapper>

                    <TooltipWrapper>
                        <Toggle
                            aria-label="Use regular expression"
                            class="size-6"
                            :disabled="!isAvailable"
                            :model-value="useRegex"
                            size="icon"
                            @update:model-value="toggleUseRegex"
                        >
                            <RegexIcon />
                        </Toggle>

                        <template #tooltip>Use regular expression</template>
                    </TooltipWrapper>
                </InputGroupAddon>
            </InputGroup>

            <ButtonGroup spacing="spaced">
                <TooltipWrapper>
                    <Button
                        aria-label="Previous match"
                        class="size-7"
                        :disabled="!canNavigate"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="goToPrevious"
                    >
                        <ChevronUpIcon />
                    </Button>

                    <template #tooltip>Previous match</template>
                </TooltipWrapper>

                <TooltipWrapper>
                    <Button
                        aria-label="Next match"
                        class="size-7"
                        :disabled="!canNavigate"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="goToNext"
                    >
                        <ChevronDownIcon />
                    </Button>

                    <template #tooltip>Next match</template>
                </TooltipWrapper>

                <TooltipWrapper>
                    <Button
                        aria-label="Close find and replace"
                        class="size-7"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="closePanel"
                    >
                        <XIcon />
                    </Button>

                    <template #tooltip>Close</template>
                </TooltipWrapper>
            </ButtonGroup>
        </div>

        <div v-show="replaceExpanded" class="mt-1 flex items-center gap-1 pl-8">
            <InputGroup class="h-7 min-w-0 flex-1">
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
                <TooltipWrapper>
                    <Button
                        aria-label="Replace current match"
                        class="size-7"
                        :disabled="!canReplaceAll"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="replaceCurrent"
                    >
                        <ReplaceIcon />
                    </Button>

                    <template #tooltip>Replace</template>
                </TooltipWrapper>

                <TooltipWrapper>
                    <Button
                        aria-label="Replace all matches"
                        class="size-7"
                        :disabled="!canReplace"
                        size="icon"
                        type="button"
                        variant="ghost"
                        @click="replaceAll"
                    >
                        <ReplaceAllIcon />
                    </Button>

                    <template #tooltip>Replace all</template>
                </TooltipWrapper>
            </ButtonGroup>
        </div>
    </div>
</template>
