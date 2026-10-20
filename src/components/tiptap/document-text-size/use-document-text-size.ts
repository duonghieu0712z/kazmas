import type { DocumentTextSizePresetValue } from './presets';
import type { DocumentTextSizeValue } from '@/extensions/tiptap';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { resolveDocumentTextSize } from '@/extensions/tiptap';

import { DOCUMENT_TEXT_SIZE_PRESETS } from './presets';

export interface UseDocumentTextSizeConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    presets?: MaybeRefOrGetter<DocumentTextSizePresetValue[] | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
    onChanged?: (textSize: DocumentTextSizeValue) => void;
}

export function isDocumentTextSizeAvailable(editor: Editor | null) {
    return (
        !!editor &&
        !editor.isDestroyed &&
        !!editor.schema.topNodeType.spec.attrs?.textSize &&
        'setDocumentTextSize' in editor.commands
    );
}

export function canSetDocumentTextSize(editor: Editor | null) {
    return (
        isDocumentTextSizeAvailable(editor) &&
        !!editor?.isEditable &&
        editor.can().setDocumentTextSize(1)
    );
}

export function setDocumentTextSize(editor: Editor | null, textSize: DocumentTextSizeValue) {
    if (!editor || !canSetDocumentTextSize(editor)) {
        return false;
    }

    return editor.chain().focus().setDocumentTextSize(textSize).run();
}

export function getDocumentTextSize(editor: Editor | null) {
    if (!editor || !isDocumentTextSizeAvailable(editor)) {
        return undefined;
    }

    return resolveDocumentTextSize(editor.state.doc.attrs.textSize);
}

export function shouldShowDocumentTextSize(
    editor: Editor | null,
    hideWhenUnavailable: boolean,
    editable = editor?.isEditable ?? false,
) {
    if (!isDocumentTextSizeAvailable(editor)) {
        return false;
    }

    return !hideWhenUnavailable || !editable || canSetDocumentTextSize(editor);
}

export function useDocumentTextSize(config: UseDocumentTextSizeConfig = {}) {
    const { editor, isEditable } = useTiptapEditor(config.editor);

    const presets = computed(() => toValue(config.presets) ?? DOCUMENT_TEXT_SIZE_PRESETS);
    const activeDocumentTextSize = computed(() => getDocumentTextSize(editor.value));
    const activePreset = computed(() =>
        presets.value.find((preset) => preset.value === activeDocumentTextSize.value),
    );

    const canSet = computed(() => isEditable.value && canSetDocumentTextSize(editor.value));
    const isVisible = computed(() =>
        shouldShowDocumentTextSize(
            editor.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );

    const handleDocumentTextSize = (textSize: DocumentTextSizeValue) => {
        const success = setDocumentTextSize(editor.value, textSize);

        if (success) {
            config.onChanged?.(textSize);
        }

        return success;
    };

    return {
        presets,
        activeDocumentTextSize,
        activePreset,
        canSet,
        isVisible,
        label: 'Document text size',
        handleDocumentTextSize,
    };
}
