import type { Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import { RedoIcon, UndoIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeTypeSelected, parseShortcutKeys } from '@/lib/tiptap';

export type UndoRedoAction = 'undo' | 'redo';

export interface UseUndoRedoConfig {
    editor?: MaybeRefOrGetter<Editor>;
    action: UndoRedoAction;
    hideWhenUnavailable?: boolean;
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

export function canExecuteUndoRedo(action: UndoRedoAction, editor?: Editor) {
    if (!editor?.isEditable || isNodeTypeSelected(editor, ['image'])) {
        return false;
    }

    return editor.can()[action]();
}

export function executeUndoRedo(action: UndoRedoAction, editor?: Editor) {
    if (!editor?.isEditable || !canExecuteUndoRedo(action, editor)) {
        return false;
    }

    return editor.chain().focus()[action]().run();
}

export function shouldShowUndoRedoButton(
    action: UndoRedoAction,
    hideWhenUnavailable: boolean,
    editor?: Editor,
) {
    if (!editor?.isEditable) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canExecuteUndoRedo(action, editor);
    }

    return true;
}

export function getFormattedUndoRedoName(action: UndoRedoAction) {
    return action.replace(/^./, (char) => char.toUpperCase());
}

export function useUndoRedo(config: UseUndoRedoConfig) {
    const editor = useTiptapEditor(config.editor);

    const canToggle = computed(() => canExecuteUndoRedo(config.action, editor.value));
    const isVisible = computed(() =>
        shouldShowUndoRedoButton(config.action, config.hideWhenUnavailable ?? false, editor.value),
    );

    const handleAction = () => {
        const success = executeUndoRedo(config.action, editor.value);
        if (success) {
            config.onExecuted?.();
        }
        return success;
    };

    return {
        isVisible,
        canToggle,
        label: getFormattedUndoRedoName(config.action),
        icon: UNDO_REDO_ICONS[config.action],
        shortcutKeys: parseShortcutKeys(UNDO_REDO_SHORTCUT_KEYS[config.action]),
        handleAction,
    };
}
