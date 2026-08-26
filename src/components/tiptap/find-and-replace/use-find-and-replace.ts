import type { FindAndReplaceStorage } from '@tiptap/extension-find-and-replace';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed, ref, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseFindAndReplaceConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    scrollIntoViewOptions?: ScrollIntoViewOptions;
    onReplaced?: () => void;
    onReplacedAll?: () => void;
}

export const FIND_AND_REPLACE_LABEL = 'Find and replace';
export const FIND_AND_REPLACE_SHORTCUT_KEY = 'mod+f';
export const DEFAULT_FIND_SCROLL_OPTIONS: ScrollIntoViewOptions = {
    block: 'nearest',
    inline: 'nearest',
};

interface FindAndReplaceEditorState {
    total: number;
    currentIndex: number | null;
    appliedSearchTerm: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    useRegex: boolean;
}

const EMPTY_EDITOR_STATE: FindAndReplaceEditorState = {
    total: 0,
    currentIndex: null,
    appliedSearchTerm: '',
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
};

export function isFindAndReplaceAvailable(editor: Editor | null) {
    return Boolean(
        editor?.extensionManager.extensions.some(
            (extension) => extension.name === 'findAndReplace',
        ),
    );
}

export function getFindAndReplaceStorage(editor: Editor | null) {
    if (!editor || !isFindAndReplaceAvailable(editor)) {
        return null;
    }

    return editor.storage.findAndReplace as FindAndReplaceStorage;
}

export function shouldShowFindAndReplace(editor: Editor | null, hideWhenUnavailable: boolean) {
    if (!editor) {
        return false;
    }

    return !hideWhenUnavailable || isFindAndReplaceAvailable(editor);
}

export function formatFindResultCount(currentIndex: number | null, total: number) {
    if (!total) {
        return '0 / 0';
    }

    if (currentIndex === null) {
        return `0 / ${total}`;
    }

    return `${currentIndex + 1} / ${total}`;
}

function navigateFindResult(editor: Editor, direction: 'next' | 'previous') {
    const selection = editor.state.selection;
    const chain = editor.chain();
    const navigation = direction === 'next' ? chain.goToNextResult() : chain.goToPreviousResult();

    return navigation
        .command(({ tr }) => {
            tr.setSelection(selection.map(tr.doc, tr.mapping));
            return true;
        })
        .run();
}

export function scrollCurrentFindResultIntoView(
    editor: Editor | null,
    options: ScrollIntoViewOptions = DEFAULT_FIND_SCROLL_OPTIONS,
) {
    if (!editor || editor.isDestroyed) {
        return;
    }

    const storage = getFindAndReplaceStorage(editor);
    const currentIndex = storage?.currentIndex;
    if (!storage || currentIndex === null || currentIndex === undefined) {
        return;
    }

    const result = storage.results[currentIndex];
    if (!result || editor.view.dom.contains(document.activeElement)) {
        return;
    }

    let target: HTMLElement | null;
    try {
        const { node } = editor.view.domAtPos(result.from);
        target = node instanceof HTMLElement ? node : node.parentElement;
    } catch {
        return;
    }

    if (!target) {
        return;
    }

    const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({
        behavior: 'smooth',
        ...options,
        ...(prefersReducedMotion ? { behavior: 'auto' as const } : {}),
    });
}

export function useFindAndReplace(config: UseFindAndReplaceConfig) {
    const editor = useTiptapEditor(config.editor);
    const searchTerm = ref('');
    const replaceTerm = ref('');
    const editorState = ref<FindAndReplaceEditorState>(EMPTY_EDITOR_STATE);

    const isAvailable = computed(() => isFindAndReplaceAvailable(editor.value));
    const isVisible = computed(() =>
        shouldShowFindAndReplace(editor.value, config.hideWhenUnavailable ?? false),
    );
    const appliedSearchTerm = computed(() => editorState.value.appliedSearchTerm);
    const total = computed(() => editorState.value.total);
    const currentIndex = computed(() => editorState.value.currentIndex);
    const caseSensitive = computed(() => editorState.value.caseSensitive);
    const wholeWord = computed(() => editorState.value.wholeWord);
    const useRegex = computed(() => editorState.value.useRegex);
    const isSearchPending = computed(() => searchTerm.value !== appliedSearchTerm.value);
    const hasNoResults = computed(
        () => Boolean(appliedSearchTerm.value) && !isSearchPending.value && total.value === 0,
    );
    const resultCountLabel = computed(() =>
        isSearchPending.value ? '…' : formatFindResultCount(currentIndex.value, total.value),
    );
    const canNavigate = computed(() => isAvailable.value && total.value > 0);
    const canReplace = computed(
        () =>
            Boolean(editor.value?.isEditable) &&
            isAvailable.value &&
            total.value > 0 &&
            currentIndex.value !== null,
    );
    const canReplaceAll = computed(
        () => Boolean(editor.value?.isEditable) && isAvailable.value && total.value > 0,
    );

    watch(
        editor,
        (currentEditor, _previousEditor, onCleanup) => {
            const currentStorage = getFindAndReplaceStorage(currentEditor);
            searchTerm.value = currentStorage?.searchTerm ?? '';
            replaceTerm.value = currentStorage?.replaceTerm ?? '';

            if (!currentEditor || !currentStorage) {
                editorState.value = EMPTY_EDITOR_STATE;
                return;
            }

            const syncEditorState = () => {
                const storage = getFindAndReplaceStorage(currentEditor);
                if (!storage) {
                    editorState.value = EMPTY_EDITOR_STATE;
                    return;
                }

                editorState.value = {
                    total: storage.results.length,
                    currentIndex: storage.currentIndex,
                    appliedSearchTerm: storage.searchTerm,
                    caseSensitive: storage.caseSensitive,
                    wholeWord: storage.wholeWord,
                    useRegex: storage.useRegex,
                };
            };

            syncEditorState();
            currentEditor.on('transaction', syncEditorState);
            onCleanup(() => currentEditor.off('transaction', syncEditorState));
        },
        { immediate: true },
    );

    watch(
        [editor, total, currentIndex, appliedSearchTerm],
        ([currentEditor, resultTotal, index], _, onCleanup) => {
            if (!currentEditor || !resultTotal || index === null) {
                return;
            }

            const frame = requestAnimationFrame(() => {
                scrollCurrentFindResultIntoView(currentEditor, config.scrollIntoViewOptions);
            });
            onCleanup(() => cancelAnimationFrame(frame));
        },
    );

    const setSearchTerm = (value: string | number) => {
        const term = String(value);
        searchTerm.value = term;
        if (isAvailable.value) {
            if (term) {
                editor.value?.commands.setSearchTerm(term);
            } else {
                editor.value?.commands.clearSearch();
            }
        }
    };

    const setReplaceTerm = (value: string | number) => {
        const term = String(value);
        replaceTerm.value = term;
        if (isAvailable.value) {
            editor.value?.commands.setReplaceTerm(term);
        }
    };

    const toggleCaseSensitive = (value: boolean) => {
        if (isAvailable.value) {
            editor.value?.commands.setCaseSensitive(value);
        }
    };

    const toggleWholeWord = (value: boolean) => {
        if (isAvailable.value) {
            editor.value?.commands.setWholeWord(value);
        }
    };

    const toggleUseRegex = (value: boolean) => {
        if (isAvailable.value) {
            editor.value?.commands.setUseRegex(value);
        }
    };

    const goToNext = () => {
        return editor.value ? navigateFindResult(editor.value, 'next') : false;
    };

    const goToPrevious = () => {
        return editor.value ? navigateFindResult(editor.value, 'previous') : false;
    };

    const replaceCurrent = () => {
        if (!canReplace.value) {
            return false;
        }

        const success = editor.value?.commands.replace() ?? false;
        if (success) {
            config.onReplaced?.();
        }
        return success;
    };

    const replaceAll = () => {
        if (!canReplaceAll.value) {
            return false;
        }

        const success = editor.value?.commands.replaceAll() ?? false;
        if (success) {
            config.onReplacedAll?.();
        }
        return success;
    };

    const applySearch = () => {
        if (!isAvailable.value) {
            return;
        }

        editor.value?.commands.setReplaceTerm(replaceTerm.value);
        if (searchTerm.value) {
            editor.value?.commands.setSearchTerm(searchTerm.value);
        }
    };

    const suspendSearch = () => {
        if (isAvailable.value) {
            editor.value?.commands.clearSearch();
        }
    };

    return {
        editor,
        isVisible,
        isAvailable,
        searchTerm,
        replaceTerm,
        appliedSearchTerm,
        total,
        currentIndex,
        caseSensitive,
        wholeWord,
        useRegex,
        isSearchPending,
        hasNoResults,
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
    };
}
