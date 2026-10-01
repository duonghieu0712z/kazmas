import type { TextAlign } from './use-text-align';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

import {
    canSetTextAlign,
    isTextAlignActive,
    isTextAlignAvailable,
    TEXT_ALIGN_ICONS,
} from './use-text-align';

export interface UseTextAlignsConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    aligns?: MaybeRefOrGetter<TextAlign[] | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
}

export const DEFAULT_TEXT_ALIGNS: TextAlign[] = ['left', 'center', 'right', 'justify'];

export function canSetAnyTextAlign(editor: Editor | null, aligns: TextAlign[]) {
    return aligns.some((align) => canSetTextAlign(editor, align));
}

export function getActiveTextAlign(editor: Editor | null, aligns: TextAlign[]) {
    return aligns.find((align) => isTextAlignActive(editor, align)) ?? aligns[0] ?? 'left';
}

export function shouldShowTextAligns(
    editor: Editor | null,
    aligns: TextAlign[],
    hideWhenUnavailable: boolean,
    editable = editor?.isEditable ?? false,
) {
    if (!editor || !isTextAlignAvailable(editor)) {
        return false;
    }

    if (hideWhenUnavailable && editable && !editor.isActive('code')) {
        return canSetAnyTextAlign(editor, aligns);
    }

    return true;
}

export function useTextAligns(config: UseTextAlignsConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);
    const aligns = computed(() => toValue(config.aligns) ?? DEFAULT_TEXT_ALIGNS);
    const activeAlign = computed(() => getActiveTextAlign(editor.value, aligns.value));
    const canAlign = computed(
        () => isEditable.value && canSetAnyTextAlign(editor.value, aligns.value),
    );
    const isVisible = computed(() =>
        shouldShowTextAligns(
            editor.value,
            aligns.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );
    const icon = computed(() => TEXT_ALIGN_ICONS[activeAlign.value]);

    return {
        activeAlign,
        aligns,
        canAlign,
        isVisible,
        icon,
        label: 'Text align',
    };
}
