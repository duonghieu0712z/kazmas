import type { HighlightPresetValue } from './presets';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { getHighlightColorPattern } from '@/lib/highlight';

import { HIGHLIGHT_PRESETS } from './presets';

export interface UseHighlightConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    presets?: MaybeRefOrGetter<HighlightPresetValue[] | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
    onHighlighted?: (preset: HighlightPresetValue) => void;
}

export function isHighlightAvailable(editor: Editor | null) {
    if (!editor || editor.isDestroyed) {
        return false;
    }

    return (
        !!editor.schema.marks.highlight &&
        'setHighlight' in editor.commands &&
        'unsetHighlight' in editor.commands
    );
}

export function canSetHighlight(editor: Editor | null) {
    return isHighlightAvailable(editor) && !!editor?.isEditable && editor.can().setHighlight();
}

export function canUnsetHighlight(editor: Editor | null) {
    if (!editor?.isEditable || !isHighlightAvailable(editor)) {
        return false;
    }

    const { selection, storedMarks, doc } = editor.state;
    const type = editor.schema.marks.highlight!;

    if (selection.empty) {
        return !!type.isInSet(storedMarks ?? selection.$from.marks());
    }

    return doc.rangeHasMark(selection.from, selection.to, type);
}

export function isHighlightActive(editor: Editor | null, preset: HighlightPresetValue) {
    return (
        isHighlightAvailable(editor) &&
        !!editor?.isActive('highlight', {
            color: getHighlightColorPattern(preset.backgroundColor),
            textColor: getHighlightColorPattern(preset.color),
        })
    );
}

export function setHighlight(editor: Editor | null, preset: HighlightPresetValue) {
    if (!editor || !canSetHighlight(editor)) {
        return false;
    }

    const attributes = {
        color: preset.backgroundColor,
        textColor: preset.color,
    };

    return editor.chain().focus().setHighlight(attributes).run();
}

export function unsetHighlight(editor: Editor | null) {
    if (!editor || !canUnsetHighlight(editor)) {
        return false;
    }

    return editor.chain().focus().unsetHighlight().run();
}

export function toggleHighlight(editor: Editor | null, preset: HighlightPresetValue) {
    if (!editor || !canSetHighlight(editor)) {
        return false;
    }

    if (isHighlightActive(editor, preset)) {
        return unsetHighlight(editor);
    }

    return setHighlight(editor, preset);
}

export function shouldShowHighlight(
    editor: Editor | null,
    hideWhenUnavailable: boolean,
    editable = editor?.isEditable ?? false,
) {
    if (!editor || !isHighlightAvailable(editor)) {
        return false;
    }

    if (hideWhenUnavailable && editable && !editor.isActive('code')) {
        return canSetHighlight(editor);
    }

    return true;
}

export function useHighlight(config: UseHighlightConfig = {}) {
    const { editor, isEditable } = useTiptapEditor(config.editor);

    const presets = computed(() => toValue(config.presets) ?? HIGHLIGHT_PRESETS);
    const canHighlight = computed(() => isEditable.value && canSetHighlight(editor.value));
    const canRemoveHighlight = computed(() => isEditable.value && canUnsetHighlight(editor.value));
    const isActive = computed(
        () => isHighlightAvailable(editor.value) && !!editor.value?.isActive('highlight'),
    );
    const activePreset = computed(() =>
        presets.value.find((preset) => isHighlightActive(editor.value, preset)),
    );
    const isVisible = computed(() =>
        shouldShowHighlight(
            editor.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );

    const handleHighlight = (preset: HighlightPresetValue) => {
        const success = setHighlight(editor.value, preset);

        if (success) {
            config.onHighlighted?.(preset);
        }

        return success;
    };

    return {
        presets,
        activePreset,
        isActive,
        canHighlight,
        canRemoveHighlight,
        isVisible,
        handleHighlight,
        handleUnsetHighlight: () => unsetHighlight(editor.value),
        handleToggleHighlight: (preset: HighlightPresetValue) =>
            toggleHighlight(editor.value, preset),
    };
}
