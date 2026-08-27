import type { InvisibleCharactersStorage } from '@tiptap/extension-invisible-characters';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { PilcrowIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseInvisibleCharactersConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    onToggled?: () => void;
}

export const INVISIBLE_CHARACTERS_LABEL = 'Show invisible characters';

export function isInvisibleCharactersAvailable(editor: Editor | null) {
    return Boolean(
        editor?.extensionManager.extensions.some(
            (extension) => extension.name === 'invisibleCharacters',
        ),
    );
}

export function getInvisibleCharactersStorage(editor: Editor | null) {
    if (!editor || !isInvisibleCharactersAvailable(editor)) {
        return null;
    }

    return editor.storage.invisibleCharacters as InvisibleCharactersStorage;
}

export function isInvisibleCharactersVisible(editor: Editor | null) {
    return getInvisibleCharactersStorage(editor)?.visibility() ?? false;
}

export function canToggleInvisibleCharacters(editor: Editor | null) {
    return Boolean(editor && !editor.isDestroyed && isInvisibleCharactersAvailable(editor));
}

export function toggleInvisibleCharacters(editor: Editor | null) {
    if (!editor || !canToggleInvisibleCharacters(editor)) {
        return false;
    }

    return editor.commands.toggleInvisibleCharacters();
}

export function shouldShowInvisibleCharactersButton(
    editor: Editor | null,
    hideWhenUnavailable: boolean,
) {
    if (!editor) {
        return false;
    }

    return !hideWhenUnavailable || isInvisibleCharactersAvailable(editor);
}

export function useInvisibleCharacters(config: UseInvisibleCharactersConfig) {
    const editor = useTiptapEditor(config.editor);
    const isActive = ref(false);

    const canToggle = computed(() => canToggleInvisibleCharacters(editor.value));
    const isVisible = computed(() =>
        shouldShowInvisibleCharactersButton(editor.value, config.hideWhenUnavailable ?? false),
    );

    watch(
        editor,
        (currentEditor, _previousEditor, onCleanup) => {
            const syncVisibility = () => {
                isActive.value = isInvisibleCharactersVisible(currentEditor);
            };

            syncVisibility();
            currentEditor?.on('transaction', syncVisibility);
            onCleanup(() => currentEditor?.off('transaction', syncVisibility));
        },
        { immediate: true },
    );

    const handleInvisibleCharacters = () => {
        const success = toggleInvisibleCharacters(editor.value);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label: INVISIBLE_CHARACTERS_LABEL,
        icon: PilcrowIcon,
        handleInvisibleCharacters,
    };
}
