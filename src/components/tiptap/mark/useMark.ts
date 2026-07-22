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
import { computed } from 'vue';

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
    label?: string;
    hideWhenUnavailable?: boolean;
    onToggled?: () => void;
}

export const MARK_ICONS = {
    bold: BoldIcon,
    italic: ItalicIcon,
    underline: UnderlineIcon,
    strike: StrikethroughIcon,
    code: Code2Icon,
    superscript: SuperscriptIcon,
    subscript: SubscriptIcon,
} satisfies Record<MarkType, Component>;

export const MARK_SHORTCUT_KEYS = {
    bold: 'mod+b',
    italic: 'mod+i',
    underline: 'mod+u',
    strike: 'mod+shift+s',
    code: 'mod+e',
    superscript: 'mod+.',
    subscript: 'mod+,',
} satisfies Record<MarkType, string>;

export function canToggleMark(editor: Editor | null, type: MarkType) {
    if (
        !editor?.isEditable ||
        !isMarkInSchema(editor, type) ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    return editor.can().toggleMark(type);
}

export function isMarkActive(editor: Editor | null, type: MarkType) {
    if (!editor?.isEditable) {
        return false;
    }

    return editor.isActive(type);
}

export function toggleMark(editor: Editor | null, type: MarkType) {
    if (!editor?.isEditable || !canToggleMark(editor, type)) {
        return false;
    }

    return editor.chain().focus().toggleMark(type).run();
}

export function showShowMarkToggle(
    editor: Editor | null,
    type: MarkType,
    hideWhenUnavailable: boolean,
) {
    if (!editor?.isEditable || !isMarkInSchema(editor, type)) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canToggleMark(editor, type);
    }

    return true;
}

export function getFormattedMarkName(type: MarkType) {
    return type.replace(/^./, (char) => char.toUpperCase());
}

export function useMark(config: UseMarkConfig) {
    const editor = useTiptapEditor(config.editor);

    const canToggle = computed(() => canToggleMark(editor.value, config.type));
    const isActive = computed(() => isMarkActive(editor.value, config.type));
    const isVisible = computed(() =>
        showShowMarkToggle(editor.value, config.type, config.hideWhenUnavailable ?? false),
    );

    const handleMark = () => {
        const success = toggleMark(editor.value, config.type);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label: config.label ?? getFormattedMarkName(config.type),
        icon: MARK_ICONS[config.type],
        shortcutKeys: parseShortcutKeys(MARK_SHORTCUT_KEYS[config.type]),
        handleMark,
    };
}
