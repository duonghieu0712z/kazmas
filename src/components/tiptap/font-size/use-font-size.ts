import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed, nextTick, ref, toValue, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseFontSizeConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
    onChanged?: (fontSize: string | null) => void;
}

export const DEFAULT_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

export function isFontSizeAvailable(editor: Editor | null) {
    return (
        !!editor &&
        !editor.isDestroyed &&
        !!editor.schema.marks.textStyle &&
        'setFontSize' in editor.commands &&
        'unsetFontSize' in editor.commands
    );
}

export function canSetFontSize(editor: Editor | null) {
    return (
        isFontSizeAvailable(editor) &&
        !!editor?.isEditable &&
        !editor.isActive('code') &&
        !editor.isActive('codeBlock') &&
        editor.can().setFontSize('1px')
    );
}

export function setFontSize(editor: Editor | null, fontSize: string | null) {
    if (!editor || !canSetFontSize(editor)) {
        return false;
    }

    if (fontSize === null) {
        return editor.chain().focus().unsetFontSize().run();
    }

    const numericSize = Number.parseFloat(fontSize);
    const isNumeric =
        /^\d+(?:\.\d+)?px$/.test(fontSize) && Number.isFinite(numericSize) && numericSize > 0;

    if (!isNumeric) {
        return false;
    }

    return editor.chain().focus().setFontSize(fontSize).run();
}

export function getActiveFontSize(editor: Editor | null): string | null | undefined {
    if (!editor || !isFontSizeAvailable(editor)) {
        return undefined;
    }

    const { selection, doc } = editor.state;

    if (selection.empty) {
        return (editor.getAttributes('textStyle').fontSize as string | null) ?? null;
    }

    const sizes = new Set<string | null>();

    for (const range of selection.ranges) {
        doc.nodesBetween(range.$from.pos, range.$to.pos, (node) => {
            if (node.isText) {
                const mark = node.marks.find((mark) => mark.type.name === 'textStyle');

                sizes.add((mark?.attrs.fontSize as string | null) ?? null);
            }
        });
    }

    return sizes.size > 1 ? undefined : ([...sizes][0] ?? null);
}

export function shouldShowFontSize(
    editor: Editor | null,
    hideWhenUnavailable: boolean,
    editable = editor?.isEditable ?? false,
) {
    if (!isFontSizeAvailable(editor)) {
        return false;
    }

    return !hideWhenUnavailable || !editable || canSetFontSize(editor);
}

export function useFontSize(config: UseFontSizeConfig = {}) {
    const { editor, isEditable } = useTiptapEditor(config.editor);

    const defaultFontSize = ref('');

    watch(
        [editor, () => editor.value?.state.doc.attrs.textSize],
        async () => {
            await nextTick();

            const currentEditor = editor.value;

            if (!currentEditor || currentEditor.isDestroyed) {
                defaultFontSize.value = '';
                return;
            }

            defaultFontSize.value = getComputedStyle(currentEditor.view.dom).fontSize;
        },
        { immediate: true, flush: 'post' },
    );

    const defaultLabel = computed(() =>
        defaultFontSize.value ? `Default · ${defaultFontSize.value.replace(/px$/, '')}` : 'Default',
    );

    const activeFontSize = computed(() => getActiveFontSize(editor.value));
    const canSet = computed(() => isEditable.value && canSetFontSize(editor.value));
    const isVisible = computed(() =>
        shouldShowFontSize(
            editor.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );

    const label = computed(() => {
        if (activeFontSize.value === undefined) {
            return 'Size';
        }

        return activeFontSize.value?.replace(/px$/, '') ?? defaultFontSize.value.replace(/px$/, '');
    });

    const handleFontSize = (fontSize: string | null) => {
        const success = setFontSize(editor.value, fontSize);

        if (success) {
            config.onChanged?.(fontSize);
        }

        return success;
    };

    return {
        activeFontSize,
        defaultFontSize,
        defaultLabel,
        canSet,
        isVisible,
        label,
        handleFontSize,
    };
}
