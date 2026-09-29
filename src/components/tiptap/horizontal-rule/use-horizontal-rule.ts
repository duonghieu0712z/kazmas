import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { MinusIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeInSchema } from '@/lib/tiptap';

export interface UseHorizontalRuleConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    onInserted?: () => void;
}

export const HORIZONTAL_RULE_LABEL = 'Horizontal rule';

export function canInsertHorizontalRule(editor: Editor | null) {
    if (!editor?.isEditable || !isNodeInSchema(editor, 'horizontalRule')) {
        return false;
    }

    return editor.can().setHorizontalRule();
}

export function insertHorizontalRule(editor: Editor | null) {
    if (!editor?.isEditable || !canInsertHorizontalRule(editor)) {
        return false;
    }

    return editor.chain().focus().setHorizontalRule().run();
}

export function shouldShowHorizontalRuleButton(
    editor: Editor | null,
    hideWhenUnavailable: boolean,
) {
    if (!editor?.isEditable || !isNodeInSchema(editor, 'horizontalRule')) {
        return false;
    }

    if (hideWhenUnavailable) {
        return canInsertHorizontalRule(editor);
    }

    return true;
}

export function useHorizontalRule(config: UseHorizontalRuleConfig) {
    const editor = useTiptapEditor(config.editor);

    const canInsert = computed(() => canInsertHorizontalRule(editor.value));
    const isVisible = computed(() =>
        shouldShowHorizontalRuleButton(editor.value, config.hideWhenUnavailable ?? false),
    );

    const handleHorizontalRule = () => {
        const success = insertHorizontalRule(editor.value);
        if (success) {
            config.onInserted?.();
        }
        return success;
    };

    return {
        isVisible,
        canInsert,
        label: HORIZONTAL_RULE_LABEL,
        icon: MinusIcon,
        handleHorizontalRule,
    };
}
