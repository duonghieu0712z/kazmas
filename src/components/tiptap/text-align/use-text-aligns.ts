import type { TextAlign } from './use-text-align';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isExtensionAvailable } from '@/lib/tiptap';

import { canSetTextAlign, isTextAlignActive, TEXT_ALIGN_ICONS } from './use-text-align';

export interface UseTextAlignsConfig {
    editor?: MaybeRefOrGetter<Editor>;
    aligns?: TextAlign[];
    hideWhenUnavailable?: boolean;
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
) {
    if (!editor?.isEditable || !isExtensionAvailable(editor, 'textAlign')) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canSetAnyTextAlign(editor, aligns);
    }

    return true;
}

export function useTextAligns(config: UseTextAlignsConfig) {
    const editor = useTiptapEditor(config.editor);
    const aligns = computed(() => config.aligns ?? DEFAULT_TEXT_ALIGNS);
    const activeAlign = computed(() => getActiveTextAlign(editor.value, aligns.value));
    const canAlign = computed(() => canSetAnyTextAlign(editor.value, aligns.value));
    const isVisible = computed(() =>
        shouldShowTextAligns(editor.value, aligns.value, config.hideWhenUnavailable ?? false),
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
