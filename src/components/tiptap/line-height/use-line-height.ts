import type { LineHeightPresetValue } from './presets';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

import { DEFAULT_LINE_HEIGHT, LINE_HEIGHT_PRESETS } from './presets';

export interface UseLineHeightConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    presets?: MaybeRefOrGetter<LineHeightPresetValue[] | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
    onChanged?: (lineHeight: number) => void;
}

export function isLineHeightAvailable(editor: Editor | null) {
    return (
        !!editor &&
        !editor.isDestroyed &&
        !!editor.schema.marks.textStyle &&
        'setLineHeight' in editor.commands
    );
}

export function canSetLineHeight(editor: Editor | null) {
    return (
        isLineHeightAvailable(editor) &&
        !!editor?.isEditable &&
        !editor.isActive('code') &&
        !editor.isActive('codeBlock') &&
        editor.can().setLineHeight(String(DEFAULT_LINE_HEIGHT))
    );
}

export function getActiveLineHeight(editor: Editor | null) {
    if (!editor || !isLineHeightAvailable(editor)) {
        return undefined;
    }

    const { selection, doc } = editor.state;

    if (selection.empty) {
        return Number(editor.getAttributes('textStyle').lineHeight ?? DEFAULT_LINE_HEIGHT);
    }

    const values = new Set<number>();

    for (const { $from, $to } of selection.ranges) {
        doc.nodesBetween($from.pos, $to.pos, (node) => {
            if (node.isText) {
                const mark = node.marks.find((mark) => mark.type.name === 'textStyle');

                values.add(Number(mark?.attrs.lineHeight ?? DEFAULT_LINE_HEIGHT));
            }
        });
    }

    return values.size > 1 ? undefined : ([...values][0] ?? DEFAULT_LINE_HEIGHT);
}

export function setLineHeight(editor: Editor | null, lineHeight: number) {
    if (!editor || !canSetLineHeight(editor) || !Number.isFinite(lineHeight) || lineHeight <= 0) {
        return false;
    }

    return editor.chain().focus().setLineHeight(String(lineHeight)).run();
}

export function shouldShowLineHeight(
    editor: Editor | null,
    hideWhenUnavailable: boolean,
    editable = editor?.isEditable ?? false,
) {
    if (!isLineHeightAvailable(editor)) {
        return false;
    }

    return !hideWhenUnavailable || !editable || canSetLineHeight(editor);
}

export function useLineHeight(config: UseLineHeightConfig = {}) {
    const { editor, isEditable } = useTiptapEditor(config.editor);

    const presets = computed(() => toValue(config.presets) ?? LINE_HEIGHT_PRESETS);
    const activeLineHeight = computed(() => getActiveLineHeight(editor.value));
    const activePreset = computed(() =>
        presets.value.find((preset) => preset.value === activeLineHeight.value),
    );

    const canSet = computed(() => isEditable.value && canSetLineHeight(editor.value));
    const isVisible = computed(() =>
        shouldShowLineHeight(
            editor.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );

    const handleLineHeight = (lineHeight: number) => {
        const success = setLineHeight(editor.value, lineHeight);

        if (success) {
            config.onChanged?.(lineHeight);
        }

        return success;
    };

    return {
        presets,
        activeLineHeight,
        activePreset,
        canSet,
        isVisible,
        label: 'Line height',
        handleLineHeight,
    };
}
