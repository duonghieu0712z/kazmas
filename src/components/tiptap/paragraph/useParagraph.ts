import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { PilcrowIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeInSchema, isNodeTypeSelected, parseShortcutKeys } from '@/lib/tiptap';

export interface UseParagraphConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    onSet?: () => void;
}

export const PARAGRAPH_LABEL = 'Paragraph';
export const PARAGRAPH_SHORTCUT_KEY = 'mod+alt+0';

export function canSetParagraph(editor: Editor | null) {
    if (
        !editor?.isEditable ||
        !isNodeInSchema(editor, 'paragraph') ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    return editor.can().setParagraph();
}

export function isParagraphActive(editor: Editor | null) {
    if (!editor?.isEditable) {
        return false;
    }

    return editor.isActive('paragraph');
}

export function setParagraph(editor: Editor | null) {
    if (!editor?.isEditable || !canSetParagraph(editor)) {
        return false;
    }

    return editor.chain().focus().setParagraph().run();
}

export function shouldShowParagraphButton(editor: Editor | null, hideWhenUnavailable: boolean) {
    if (!editor?.isEditable || !isNodeInSchema(editor, 'paragraph')) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canSetParagraph(editor);
    }

    return true;
}

export function useParagraph(config: UseParagraphConfig) {
    const editor = useTiptapEditor(config.editor);

    const canSet = computed(() => canSetParagraph(editor.value));
    const isActive = computed(() => isParagraphActive(editor.value));
    const isVisible = computed(() =>
        shouldShowParagraphButton(editor.value, config.hideWhenUnavailable ?? false),
    );

    const handleParagraph = () => {
        const success = setParagraph(editor.value);
        if (success) {
            config.onSet?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canSet,
        label: PARAGRAPH_LABEL,
        icon: PilcrowIcon,
        shortcutKeys: parseShortcutKeys(PARAGRAPH_SHORTCUT_KEY),
        handleParagraph,
    };
}
