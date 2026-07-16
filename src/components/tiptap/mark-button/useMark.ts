import type { Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import {
    BoldIcon,
    Code2Icon,
    ItalicIcon,
    StrikethroughIcon,
    SubscriptIcon,
    SuperscriptIcon,
    UnderlineIcon,
} from '@lucide/vue';
import { ref, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isMarkInSchema, isNodeTypeSelected, parseShortcutKeys } from '@/lib/tiptap';

export type MarkType =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'code'
    | 'superscript'
    | 'subscript';

export interface UseMarkConfig {
    editor?: MaybeRefOrGetter<Editor>;
    type: MarkType;
    hideWhenUnavailable?: boolean;
    onToggled?: () => void;
}

const MARK_ICONS = {
    bold: BoldIcon,
    italic: ItalicIcon,
    underline: UnderlineIcon,
    strike: StrikethroughIcon,
    code: Code2Icon,
    superscript: SuperscriptIcon,
    subscript: SubscriptIcon,
} satisfies Record<MarkType, Component>;

const MARK_SHORTCUT_KEYS = {
    bold: 'mod+b',
    italic: 'mod+i',
    underline: 'mod+u',
    strike: 'mod+shift+s',
    code: 'mod+e',
    superscript: 'mod+.',
    subscript: 'mod+,',
} satisfies Record<MarkType, string>;

function canToggleMark(type: MarkType, editor?: Editor) {
    if (!editor?.isEditable) {
        return false;
    }

    if (!isMarkInSchema(editor, type) || isNodeTypeSelected(editor, ['image'])) {
        return false;
    }

    return editor.can().toggleMark(type);
}

function isMarkActive(type: MarkType, editor?: Editor) {
    if (!editor?.isEditable) {
        return false;
    }

    return editor.isActive(type);
}

function toggleMark(type: MarkType, editor?: Editor) {
    if (!editor?.isEditable || !canToggleMark(type, editor)) {
        return false;
    }

    return editor.chain().focus().toggleMark(type).run();
}

function shouldShowButton(type: MarkType, hideWhenUnavailable: boolean, editor?: Editor) {
    if (!editor?.isEditable) {
        return false;
    }

    if (!isMarkInSchema(editor, type)) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canToggleMark(type, editor);
    }

    return true;
}

function getFormattedMarkName(type: MarkType) {
    return type.replace(/^./, (char) => char.toUpperCase());
}

export function useMark(config: UseMarkConfig) {
    const editor = useTiptapEditor(config.editor);

    const isVisible = ref(true);
    const canToggle = ref(false);
    const isActive = ref(false);

    const refreshState = () => {
        canToggle.value = canToggleMark(config.type, editor.value);
        isActive.value = isMarkActive(config.type, editor.value);
        isVisible.value = shouldShowButton(
            config.type,
            config.hideWhenUnavailable ?? false,
            editor.value,
        );
    };

    watch(
        editor,
        (currentEditor, _, onCleanup) => {
            refreshState();

            if (!currentEditor) {
                return;
            }

            currentEditor.on('selectionUpdate', refreshState);
            currentEditor.on('transaction', refreshState);

            onCleanup(() => {
                currentEditor.off('selectionUpdate', refreshState);
                currentEditor.off('transaction', refreshState);
            });
        },
        { immediate: true },
    );

    const handleMark = () => {
        const success = toggleMark(config.type, editor.value);

        if (success) {
            config.onToggled?.();
            refreshState();
        }

        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label: getFormattedMarkName(config.type),
        icon: MARK_ICONS[config.type],
        shortcutKeys: parseShortcutKeys(MARK_SHORTCUT_KEYS[config.type]),
        handleMark,
    };
}
