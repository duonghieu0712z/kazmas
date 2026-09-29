import type { HeadingLevel } from './use-heading';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { HeadingIcon, TypeIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import {
    canSetParagraph,
    isParagraphActive,
    PARAGRAPH_LABEL,
    PARAGRAPH_SHORTCUT_KEY,
    setParagraph,
} from '@/components/tiptap/paragraph';
import { isNodeInSchema, parseShortcutKeys } from '@/lib/tiptap';

import {
    canToggleHeading,
    HEADING_ICONS,
    HEADING_SHORTCUT_KEYS,
    isHeadingActive,
    toggleHeading,
} from './use-heading';

export type HeadingOptionLevel = Exclude<HeadingLevel, 0>;

export interface UseHeadingsConfig {
    editor?: MaybeRefOrGetter<Editor>;
    levels?: HeadingOptionLevel[];
    hideWhenUnavailable?: boolean;
    onChanged?: (level: HeadingLevel) => void;
}

export const DEFAULT_HEADING_LEVELS: HeadingOptionLevel[] = [1, 2, 3, 4, 5, 6];

export function getActiveHeadingLevel(
    editor: Editor | null,
    levels: HeadingOptionLevel[] = DEFAULT_HEADING_LEVELS,
) {
    return levels.find((level) => isHeadingActive(editor, level));
}

export function canSetHeadingLevel(editor: Editor | null, level: HeadingLevel) {
    return level === 0 ? canSetParagraph(editor) : canToggleHeading(editor, level);
}

export function setHeadingLevel(editor: Editor | null, level: HeadingLevel) {
    return level === 0 ? setParagraph(editor) : toggleHeading(editor, level);
}

export function shouldShowHeadings(
    editor: Editor | null,
    levels: HeadingOptionLevel[],
    hideWhenUnavailable: boolean,
) {
    if (
        !editor?.isEditable ||
        (!isNodeInSchema(editor, 'paragraph') && !isNodeInSchema(editor, 'heading'))
    ) {
        return false;
    }

    return (
        !hideWhenUnavailable ||
        canSetParagraph(editor) ||
        levels.some((level) => canToggleHeading(editor, level))
    );
}

export function useHeadings(config: UseHeadingsConfig) {
    const editor = useTiptapEditor(config.editor);
    const levels = computed(() => config.levels ?? DEFAULT_HEADING_LEVELS);
    const activeLevel = computed<HeadingLevel | undefined>(() => {
        if (isParagraphActive(editor.value)) {
            return 0;
        }

        return getActiveHeadingLevel(editor.value, levels.value);
    });
    const canSet = computed(
        () =>
            canSetParagraph(editor.value) ||
            levels.value.some((level) => canToggleHeading(editor.value, level)),
    );
    const isVisible = computed(() =>
        shouldShowHeadings(editor.value, levels.value, config.hideWhenUnavailable ?? false),
    );
    const label = computed(() =>
        activeLevel.value === 0
            ? PARAGRAPH_LABEL
            : activeLevel.value
              ? `Heading ${activeLevel.value}`
              : 'Text style',
    );
    const icon = computed(() =>
        activeLevel.value === 0
            ? TypeIcon
            : activeLevel.value
              ? HEADING_ICONS[activeLevel.value]
              : HeadingIcon,
    );

    const getLabel = (level: HeadingLevel) => (level === 0 ? PARAGRAPH_LABEL : `Heading ${level}`);
    const getIcon = (level: HeadingLevel) => (level === 0 ? TypeIcon : HEADING_ICONS[level]);
    const getShortcutKeys = (level: HeadingLevel) =>
        parseShortcutKeys(level === 0 ? PARAGRAPH_SHORTCUT_KEY : HEADING_SHORTCUT_KEYS[level]);
    const canSetLevel = (level: HeadingLevel) => canSetHeadingLevel(editor.value, level);
    const handleLevel = (level: HeadingLevel) => {
        const success = setHeadingLevel(editor.value, level);
        if (success) {
            config.onChanged?.(level);
        }
        return success;
    };

    return {
        activeLevel,
        canSet,
        isVisible,
        label,
        icon,
        levels,
        getLabel,
        getIcon,
        getShortcutKeys,
        canSetLevel,
        handleLevel,
    };
}
