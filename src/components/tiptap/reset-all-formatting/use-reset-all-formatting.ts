import type { Transaction } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { RemoveFormattingIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseResetAllFormattingConfig {
    editor?: MaybeRefOrGetter<Editor>;
    preserveMarks?: string[];
    hideWhenUnavailable?: boolean;
    onReset?: () => void;
}

export const RESET_ALL_FORMATTING_LABEL = 'Reset all formatting';

export function removeAllMarksExcept(transaction: Transaction, preserveMarks: string[] = []) {
    const preservedMarks = new Set(preserveMarks);
    const { from, to } = transaction.selection;

    for (const markType of Object.values(transaction.doc.type.schema.marks)) {
        if (!preservedMarks.has(markType.name)) {
            transaction.removeMark(from, to, markType);
        }
    }

    return transaction;
}

export function canResetMarks(transaction: Transaction, preserveMarks: string[] = []) {
    const stepCount = transaction.steps.length;
    removeAllMarksExcept(transaction, preserveMarks);
    return transaction.steps.length > stepCount;
}

export function canResetAllFormatting(editor: Editor | null, preserveMarks: string[] = []) {
    if (!editor?.isEditable || editor.state.selection.empty) {
        return false;
    }

    return canResetMarks(editor.state.tr, preserveMarks);
}

export function resetAllFormatting(editor: Editor | null, preserveMarks: string[] = []) {
    if (!editor?.isEditable || !canResetAllFormatting(editor, preserveMarks)) {
        return false;
    }

    return editor
        .chain()
        .focus()
        .command(({ tr }) => {
            removeAllMarksExcept(tr, preserveMarks);
            return true;
        })
        .run();
}

export function shouldShowResetAllFormattingButton(
    editor: Editor | null,
    preserveMarks: string[],
    hideWhenUnavailable: boolean,
) {
    if (!editor?.isEditable) {
        return false;
    }

    return !hideWhenUnavailable || canResetAllFormatting(editor, preserveMarks);
}

export function useResetAllFormatting(config: UseResetAllFormattingConfig) {
    const editor = useTiptapEditor(config.editor);
    const preserveMarks = config.preserveMarks ?? [];

    const canReset = computed(() => canResetAllFormatting(editor.value, preserveMarks));
    const isVisible = computed(() =>
        shouldShowResetAllFormattingButton(
            editor.value,
            preserveMarks,
            config.hideWhenUnavailable ?? false,
        ),
    );

    const handleResetAllFormatting = () => {
        const success = resetAllFormatting(editor.value, preserveMarks);
        if (success) {
            config.onReset?.();
        }
        return success;
    };

    return {
        isVisible,
        canReset,
        label: RESET_ALL_FORMATTING_LABEL,
        icon: RemoveFormattingIcon,
        handleResetAllFormatting,
    };
}
