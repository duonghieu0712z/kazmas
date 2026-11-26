import type { TextColorPresetValue, TextColorType } from '.';
import type { Mark } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { HighlighterIcon, LetterAIcon, PaintBucketIcon } from '@lucide/vue';
import { computed, ref, toValue, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { matchesRgb, toRgb } from '@/lib/color';
import { getHighlightColorPattern } from '@/lib/highlight';

import { HIGHLIGHT_PRESETS, TEXT_BACKGROUND_COLOR_PRESETS, TEXT_COLOR_PRESETS } from './presets';

type TextColorChoice = TextColorPresetValue | string;

interface UseTextColorConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    type: MaybeRefOrGetter<TextColorType>;
    presets?: MaybeRefOrGetter<TextColorPresetValue[] | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
}

const colorControls = {
    highlight: {
        label: 'Highlight',
        paletteLabel: 'Highlight colors',
        icon: HighlighterIcon,
    },
    color: {
        label: 'Text color',
        paletteLabel: 'Text color palette',
        icon: LetterAIcon,
    },
    backgroundColor: {
        label: 'Background color',
        paletteLabel: 'Background color palette',
        icon: PaintBucketIcon,
    },
};

function isColorAvailable(editor: Editor | null, type: TextColorType): editor is Editor {
    if (!editor || editor.isDestroyed) {
        return false;
    }

    const { commands, schema } = editor;

    if (type === 'highlight') {
        return (
            !!schema.marks.highlight && 'setHighlight' in commands && 'unsetHighlight' in commands
        );
    }

    if (!schema.marks.textStyle) {
        return false;
    }

    return type === 'color'
        ? 'setColor' in commands && 'unsetColor' in commands
        : 'setBackgroundColor' in commands && 'unsetBackgroundColor' in commands;
}

function canSetColor(editor: Editor | null, type: TextColorType) {
    if (!isColorAvailable(editor, type) || !editor.isEditable) {
        return false;
    }

    if (type === 'highlight') {
        return editor.can().setHighlight();
    }

    if (editor.isActive('code') || editor.isActive('codeBlock')) {
        return false;
    }

    return type === 'color'
        ? editor.can().setColor('currentColor')
        : editor.can().setBackgroundColor('transparent');
}

function getMarkColor(
    marks: readonly Mark[],
    type: Exclude<TextColorType, 'highlight'>,
): string | null {
    const textStyle = marks.find((mark) => mark.type.name === 'textStyle');

    return (textStyle?.attrs[type] as string | null) || null;
}

function canRemoveColor(editor: Editor | null, type: TextColorType) {
    if (
        !editor?.isEditable ||
        !(type === 'highlight' ? isColorAvailable(editor, type) : canSetColor(editor, type))
    ) {
        return false;
    }

    const { selection, storedMarks, doc } = editor.state;

    if (type === 'highlight') {
        const mark = editor.schema.marks.highlight!;

        return selection.empty
            ? !!mark.isInSet(storedMarks ?? selection.$from.marks())
            : doc.rangeHasMark(selection.from, selection.to, mark);
    }

    if (selection.empty) {
        return !!getMarkColor(storedMarks ?? selection.$from.marks(), type);
    }

    let hasColor = false;

    doc.nodesBetween(selection.from, selection.to, (node) => {
        if (node.isText) {
            hasColor ||= !!getMarkColor(node.marks, type);
        }
    });

    return hasColor;
}

export function getActiveColor(
    editor: Editor | null,
    type: TextColorType,
    presets: readonly TextColorPresetValue[],
): TextColorChoice | null | undefined {
    if (!isColorAvailable(editor, type)) {
        return undefined;
    }

    if (type === 'highlight') {
        return presets.find(
            (preset) =>
                preset.textColor &&
                editor.isActive('highlight', {
                    color: getHighlightColorPattern(preset.color),
                    textColor: getHighlightColorPattern(preset.textColor),
                }),
        );
    }

    const { selection, storedMarks, doc } = editor.state;

    if (selection.empty) {
        return getMarkColor(storedMarks ?? selection.$from.marks(), type);
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

export function setColor(
    editor: Editor | null,
    type: TextColorType,
    choice: TextColorChoice | null,
) {
    if (!editor) {
        return false;
    }

    const canChange =
        type === 'highlight' && choice === null
            ? canRemoveColor(editor, type)
            : canSetColor(editor, type);

    if (!canChange) {
        return false;
    }

    if (type === 'highlight') {
        if (choice === null) {
            return editor.chain().focus().unsetHighlight().run();
        }

        if (typeof choice === 'string' || !choice.textColor) {
            return false;
        }

        const attributes = { color: choice.color, textColor: choice.textColor };

        return editor.chain().focus().setHighlight(attributes).run();
    }

    const color = typeof choice === 'string' ? choice : (choice?.color ?? null);

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

            commands.updateAttributes('highlight', attributes);

            return true;
        })
        .run();
}

export function useTextColor(config: UseTextColorConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);
    const type = computed(() => toValue(config.type));
    const lastChoice = ref<TextColorChoice>();

    const control = computed(() => colorControls[type.value]);
    const isHighlight = computed(() => type.value === 'highlight');
    const presets = computed(() => {
        const customPresets = toValue(config.presets);

        if (customPresets) {
            return customPresets;
        }

        if (type.value === 'highlight') {
            return HIGHLIGHT_PRESETS;
        }

        return type.value === 'color' ? TEXT_COLOR_PRESETS : TEXT_BACKGROUND_COLOR_PRESETS;
    });

    const resolveTextColor = (color?: string) => {
        const variable = color?.match(/^var\((--[\w-]+)\)$/)?.[1];

        if (color && !variable && color !== 'currentColor' && color !== 'inherit') {
            return color;
        }

        const currentEditor = editor.value;

        if (!currentEditor || currentEditor.isDestroyed || type.value === 'highlight') {
            return undefined;
        }

        const styles = getComputedStyle(currentEditor.view.dom);

        if (variable) {
            return styles.getPropertyValue(variable).trim() || undefined;
        }

        return color ? styles.color : styles[type.value];
    };

    const activeColor = computed(() => getActiveColor(editor.value, type.value, presets.value));

    const activePreset = computed(() => {
        const color = activeColor.value;

        if (typeof color !== 'string') {
            return color ?? undefined;
        }

        const exactPreset = presets.value.find((preset) => preset.color === color);

        if (exactPreset) {
            return exactPreset;
        }

        const activeRgb = toRgb(resolveTextColor(color));

        if (!activeRgb) {
            return undefined;
        }

        return presets.value.find((preset) => {
            const presetRgb = toRgb(resolveTextColor(preset.color));

            return !!presetRgb && matchesRgb(activeRgb, presetRgb);
        });
    });

    const activeChoice = computed(() => activePreset.value ?? activeColor.value ?? undefined);
    const selectedChoice = computed(() => {
        if (type.value === 'highlight') {
            const choice = lastChoice.value;
            const id = typeof choice === 'string' ? undefined : choice?.id;

            return (
                presets.value.find((preset) => preset.id === id) ??
                presets.value[0] ??
                HIGHLIGHT_PRESETS[0]
            );
        }

        return lastChoice.value ?? presets.value[0];
    });
    const selectedPreset = computed(() => {
        const choice = selectedChoice.value;

        return typeof choice === 'string' ? undefined : choice;
    });
    const selectedColor = computed(() => {
        const choice = selectedChoice.value;

        return typeof choice === 'string' ? choice : choice?.color;
    });
    const isActive = computed(() => {
        if (type.value === 'highlight') {
            const preset = selectedPreset.value;

            return !!preset && preset.id === activePreset.value?.id;
        }

        const color = selectedColor.value;

        return !!color && (color === activeColor.value || color === activePreset.value?.color);
    });

    watch(
        [type, activeChoice],
        ([currentType, choice], [previousType]) => {
            if (choice || currentType !== previousType) {
                lastChoice.value = choice;
            }
        },
        { immediate: true },
    );

    const canSet = computed(() => isEditable.value && canSetColor(editor.value, type.value));
    const canRemove = computed(() => isEditable.value && canRemoveColor(editor.value, type.value));
    const isVisible = computed(() => {
        const currentEditor = editor.value;

        return (
            isColorAvailable(currentEditor, type.value) &&
            (!toValue(config.hideWhenUnavailable) ||
                !isEditable.value ||
                canSet.value ||
                (type.value === 'highlight' && currentEditor.isActive('code')))
        );
    });

    const changeColor = (choice: TextColorChoice | null) => {
        if (!setColor(editor.value, type.value, choice)) {
            return false;
        }

        if (choice !== null) {
            lastChoice.value = choice;
        }

        return true;
    };

    const toggleSelectedColor = () => {
        const selected = selectedChoice.value;

        if (!selected) {
            return undefined;
        }

        const choice = isActive.value ? null : selected;

        return changeColor(choice) ? choice : undefined;
    };

    return {
        control,
        isHighlight,
        presets,
        activePreset,
        selectedChoice,
        selectedPreset,
        selectedColor,
        isActive,
        canSet,
        canRemove,
        isVisible,
        resolveTextColor,
        changeColor,
        toggleSelectedColor,
    };
}
