import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { LanguagesIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isMarkInSchema, isNodeTypeSelected } from '@/lib/tiptap';

export interface UseRubyTextConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    onSetRubyText?: () => void;
}

export const RUBY_TEXT_LABEL = 'Ruby text';

export function canSetRubyText(editor: Editor | null) {
    if (
        !editor?.isEditable ||
        !isMarkInSchema(editor, 'rubyText') ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    if (editor.state.selection.empty && !editor.isActive('rubyText')) {
        return false;
    }

    return editor.can().setRubyText({ rt: '' });
}

export function isRubyTextActive(editor: Editor | null) {
    if (!editor?.isEditable || !isMarkInSchema(editor, 'rubyText')) {
        return false;
    }

    return editor.isActive('rubyText');
}

export function shouldShowRubyTextButton(editor: Editor | null, hideWhenUnavailable: boolean) {
    if (!editor?.isEditable || !isMarkInSchema(editor, 'rubyText')) {
        return false;
    }

    return !hideWhenUnavailable || canSetRubyText(editor);
}

export function setRubyText(editor: Editor | null, annotation: string) {
    const rt = annotation.trim();
    if (!editor || !rt || !canSetRubyText(editor)) {
        return false;
    }

    return editor.chain().focus().extendMarkRange('rubyText').setRubyText({ rt }).run();
}

export function removeRubyText(editor: Editor | null) {
    if (!editor || !isRubyTextActive(editor)) {
        return false;
    }

    return editor.chain().focus().extendMarkRange('rubyText').unsetRubyText().run();
}

export function useRubyText(config: UseRubyTextConfig = {}) {
    const editor = useTiptapEditor(config.editor);
    const annotation = ref('');

    const canSet = computed(() => canSetRubyText(editor.value));
    const isActive = computed(() => isRubyTextActive(editor.value));
    const isVisible = computed(() =>
        shouldShowRubyTextButton(editor.value, config.hideWhenUnavailable ?? false),
    );

    watch(
        editor,
        (currentEditor, _previousEditor, onCleanup) => {
            if (!currentEditor) {
                annotation.value = '';
                return;
            }

            function updateRubyTextState() {
                const rt = currentEditor?.getAttributes('rubyText').rt;
                annotation.value = typeof rt === 'string' ? rt : '';
            }

            updateRubyTextState();
            currentEditor.on('selectionUpdate', updateRubyTextState);
            currentEditor.on('update', updateRubyTextState);
            onCleanup(() => {
                currentEditor.off('selectionUpdate', updateRubyTextState);
                currentEditor.off('update', updateRubyTextState);
            });
        },
        { immediate: true },
    );

    const handleSetRubyText = () => {
        const success = setRubyText(editor.value, annotation.value);
        if (success) {
            config.onSetRubyText?.();
        }
        return success;
    };

    const handleRemoveRubyText = () => {
        const success = removeRubyText(editor.value);
        if (success) {
            annotation.value = '';
        }
        return success;
    };

    return {
        annotation,
        canSet,
        isActive,
        isVisible,
        label: RUBY_TEXT_LABEL,
        icon: LanguagesIcon,
        handleSetRubyText,
        handleRemoveRubyText,
    };
}
