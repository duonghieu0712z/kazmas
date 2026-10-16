import type { TextStyleColorPresetValue, TextStyleColorType } from './presets';
import type { Mark } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { BaselineIcon, PaintBucketIcon } from '@lucide/vue';
import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

import { getColorHex } from './colors';
import { TEXT_BACKGROUND_COLOR_PRESETS, TEXT_COLOR_PRESETS } from './presets';

export interface UseTextStyleColorConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    type: MaybeRefOrGetter<TextStyleColorType>;
    presets?: MaybeRefOrGetter<TextStyleColorPresetValue[] | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
}

export function isTextStyleColorAvailable(editor: Editor | null, type: TextStyleColorType) {
    if (!editor || editor.isDestroyed || !editor.schema.marks.textStyle) {
        return false;
    }

    if (type === 'color') {
        return 'setColor' in editor.commands && 'unsetColor' in editor.commands;
    }

    return 'setBackgroundColor' in editor.commands && 'unsetBackgroundColor' in editor.commands;
}

export function canSetTextStyleColor(editor: Editor | null, type: TextStyleColorType) {
    if (
        !isTextStyleColorAvailable(editor, type) ||
        !editor?.isEditable ||
        editor.isActive('code') ||
        editor.isActive('codeBlock')
    ) {
        return false;
    }

    if (type === 'color') {
        return editor.can().setColor('currentColor');
    }

    return editor.can().setBackgroundColor('transparent');
}

function getMarkColor(marks: readonly Mark[], type: TextStyleColorType): string | null {
    const highlight = marks.find((mark) => mark.type.name === 'highlight');
    const highlightAttribute = type === 'color' ? 'textColor' : 'color';
    const highlightColor = highlight?.attrs[highlightAttribute] as string | null | undefined;

    if (highlightColor && highlightColor !== 'inherit' && highlightColor !== 'transparent') {
        return highlightColor;
    }

    const textStyle = marks.find((mark) => mark.type.name === 'textStyle');

    return (textStyle?.attrs[type] as string | null) || null;
}

export function getActiveTextStyleColor(editor: Editor | null, type: TextStyleColorType) {
    if (!editor || !isTextStyleColorAvailable(editor, type)) {
        return undefined;
    }

    const { selection, doc } = editor.state;

    if (selection.empty) {
        return getMarkColor(editor.state.storedMarks ?? selection.$from.marks(), type);
    }

    const colors = new Set<string | null>();

    for (const { $from, $to } of selection.ranges) {
        doc.nodesBetween($from.pos, $to.pos, (node) => {
            if (node.isText) {
                colors.add(getMarkColor(node.marks, type));
            }
        });
    }

    return colors.size > 1 ? undefined : ([...colors][0] ?? null);
}

export function setTextStyleColor(
    editor: Editor | null,
    type: TextStyleColorType,
    color: string | null,
) {
    if (!editor || !canSetTextStyleColor(editor, type)) {
        return false;
    }

    if (color !== null && !CSS.supports('color', color)) {
        return false;
    }

    const chain = editor.chain().focus();

    if (type === 'color') {
        if (color === null) {
            chain.unsetColor();
        } else {
            chain.setColor(color);
        }
    } else if (color === null) {
        chain.unsetBackgroundColor();
    } else {
        chain.setBackgroundColor(color);
    }

    return chain
        .command(({ tr, commands }) => {
            if (!editor.schema.marks.highlight) {
                return true;
            }

            const attribute = type === 'color' ? 'textColor' : 'color';
            const clearedColor = type === 'color' ? 'inherit' : 'transparent';
            const attributes = { [attribute]: color ?? clearedColor };

            if (tr.selection.empty) {
                const marks = tr.storedMarks ?? tr.selection.$from.marks();
                const highlight = marks.find((mark) => mark.type.name === 'highlight');

                if (highlight) {
                    tr.addStoredMark(highlight.type.create({ ...highlight.attrs, ...attributes }));
                }

                return true;
            }

            return commands.updateAttributes('highlight', attributes);
        })
        .run();
}

export function useTextStyleColor(config: UseTextStyleColorConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);
    const type = computed(() => toValue(config.type));

    const presets = computed(() => {
        const customPresets = toValue(config.presets);

        if (customPresets) {
            return customPresets;
        }

        return type.value === 'color' ? TEXT_COLOR_PRESETS : TEXT_BACKGROUND_COLOR_PRESETS;
    });

    const activeColor = computed(() => getActiveTextStyleColor(editor.value, type.value));
    const activeHex = computed(() => {
        if (!activeColor.value || !editor.value || editor.value.isDestroyed) {
            return undefined;
        }

        return getColorHex(activeColor.value, editor.value.view.dom);
    });

    const activePreset = computed(() => {
        const element = editor.value?.view.dom;

        if (!element || !activeHex.value) {
            return undefined;
        }

        return presets.value.find(
            (preset) => getColorHex(preset.color, element) === activeHex.value,
        );
    });

    const canSet = computed(
        () => isEditable.value && canSetTextStyleColor(editor.value, type.value),
    );
    const canRemove = computed(() => {
        if (!canSet.value || !editor.value) {
            return false;
        }

        if (editor.value.state.selection.empty) {
            return !!activeColor.value;
        }

        const { from, to } = editor.value.state.selection;
        let hasColor = false;

        editor.value.state.doc.nodesBetween(from, to, (node) => {
            if (node.isText) {
                hasColor ||= !!getMarkColor(node.marks, type.value);
            }
        });

        return hasColor;
    });
    const isVisible = computed(() => {
        if (!isTextStyleColorAvailable(editor.value, type.value)) {
            return false;
        }

        return !toValue(config.hideWhenUnavailable) || !isEditable.value || canSet.value;
    });

    const label = computed(() => (type.value === 'color' ? 'Text color' : 'Text background color'));
    const icon = computed(() => (type.value === 'color' ? BaselineIcon : PaintBucketIcon));

    return {
        editor,
        presets,
        activeColor,
        activePreset,
        canSet,
        canRemove,
        isVisible,
        label,
        icon,
        handleColor: (color: string | null) => setTextStyleColor(editor.value, type.value, color),
    };
}
