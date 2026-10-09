import type { Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import { RedoIcon, UndoIcon } from '@lucide/vue';
import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeTypeSelected } from '@/lib/tiptap';
import { getShortcutKeys } from '@/utils/shortcut';

export type UndoRedoAction = 'undo' | 'redo';

export interface UseUndoRedoConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    action: MaybeRefOrGetter<UndoRedoAction>;
    label?: MaybeRefOrGetter<string | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
    onExecuted?: () => void;
}

export const UNDO_REDO_ICONS = {
    undo: UndoIcon,
    redo: RedoIcon,
} satisfies Record<UndoRedoAction, Component>;

export const UNDO_REDO_SHORTCUT_KEYS = {
    undo: 'mod+z',
    redo: 'mod+shift+z',
} satisfies Record<UndoRedoAction, string>;

export function canExecuteUndoRedo(editor: Editor | null, action: UndoRedoAction) {
    if (!editor?.isEditable || isNodeTypeSelected(editor, ['image'])) {
        return false;
    }

    return editor.can()[action]();
}

export function executeUndoRedo(editor: Editor | null, action: UndoRedoAction) {
    if (!editor?.isEditable || !canExecuteUndoRedo(editor, action)) {
        return false;
    }

    return editor.chain().focus()[action]().run();
}

export function shouldShowUndoRedoButton(
    editor: Editor | null,
    action: UndoRedoAction,
    hideWhenUnavailable: boolean,
    editable = editor?.isEditable ?? false,
) {
    if (!editor) {
        return false;
    }

    if (hideWhenUnavailable && editable && !editor.isActive('code')) {
        return canExecuteUndoRedo(editor, action);
    }

    return true;
}

export function getFormattedUndoRedoName(action: UndoRedoAction) {
    return action.replace(/^./, (char) => char.toUpperCase());
}

export function useUndoRedo(config: UseUndoRedoConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);
    const action = computed(() => toValue(config.action));

    const canToggle = computed(
        () => isEditable.value && canExecuteUndoRedo(editor.value, action.value),
    );
    const isVisible = computed(() =>
        shouldShowUndoRedoButton(
            editor.value,
            action.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );
    const label = computed(() => toValue(config.label) ?? getFormattedUndoRedoName(action.value));
    const icon = computed(() => UNDO_REDO_ICONS[action.value]);
    const shortcutKeys = computed(() => getShortcutKeys(UNDO_REDO_SHORTCUT_KEYS[action.value]));

    const handleAction = () => {
        const success = executeUndoRedo(editor.value, action.value);
        if (success) {
            config.onExecuted?.();
        }
        return success;
    };

    return {
        isVisible,
        canToggle,
        label,
        icon,
        shortcutKeys,
        handleAction,
    };
}
