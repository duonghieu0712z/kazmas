import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { MinusIcon } from '@lucide/vue';
import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeInSchema } from '@/lib/tiptap';

export interface UseHorizontalRuleConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
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
    editable = editor?.isEditable ?? false,
) {
    if (!editor || !isNodeInSchema(editor, 'horizontalRule')) {
        return false;
    }

    if (hideWhenUnavailable && editable) {
        return canInsertHorizontalRule(editor);
    }

    return true;
}

export function useHorizontalRule(config: UseHorizontalRuleConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);

    const canInsert = computed(() => isEditable.value && canInsertHorizontalRule(editor.value));
    const isVisible = computed(() =>
        shouldShowHorizontalRuleButton(
            editor.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
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
