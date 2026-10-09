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
import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isMarkInSchema, isNodeTypeSelected } from '@/lib/tiptap';
import { getShortcutKeys } from '@/utils/shortcut';

export type MarkType =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'code'
    | 'superscript'
    | 'subscript';

export interface UseMarkConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    type: MaybeRefOrGetter<MarkType>;
    label?: MaybeRefOrGetter<string | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
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
    if (!editor) {
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

export function shouldShowMarkButton(
    editor: Editor | null,
    type: MarkType,
    hideWhenUnavailable: boolean,
    editable = editor?.isEditable ?? false,
) {
    if (!editor || !isMarkInSchema(editor, type)) {
        return false;
    }

    if (hideWhenUnavailable && editable && !editor.isActive('code')) {
        return canToggleMark(editor, type);
    }

    return true;
}

export function getFormattedMarkName(type: MarkType) {
    return type.replace(/^./, (char) => char.toUpperCase());
}

export function useMark(config: UseMarkConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);
    const type = computed(() => toValue(config.type));

    const canToggle = computed(() => isEditable.value && canToggleMark(editor.value, type.value));
    const isActive = computed(() => isMarkActive(editor.value, type.value));
    const isVisible = computed(() =>
        shouldShowMarkButton(
            editor.value,
            type.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );
    const label = computed(() => toValue(config.label) ?? getFormattedMarkName(type.value));
    const icon = computed(() => MARK_ICONS[type.value]);
    const shortcutKeys = computed(() => getShortcutKeys(MARK_SHORTCUT_KEYS[type.value]));

    const handleMark = () => {
        const success = toggleMark(editor.value, type.value);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label,
        icon,
        shortcutKeys,
        handleMark,
    };
}
