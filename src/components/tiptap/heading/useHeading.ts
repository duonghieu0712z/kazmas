import type { Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import {
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    Heading4Icon,
    Heading5Icon,
    Heading6Icon,
    HeadingIcon,
} from '@lucide/vue';
import { NodeSelection } from '@tiptap/pm/state';
import { isNodeSelection, isTextSelection } from '@tiptap/vue-3';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import {
    findNodePosition,
    isNodeInSchema,
    isNodeTypeSelected,
    isValidPosition,
    parseShortcutKeys,
} from '@/lib/tiptap';

export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface UseHeadingConfig {
    editor?: MaybeRefOrGetter<Editor>;
    level: HeadingLevel;
    hideWhenUnavailable?: boolean;
    onToggled?: () => void;
}

export const HEADING_ICONS = [
    HeadingIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    Heading4Icon,
    Heading5Icon,
    Heading6Icon,
] satisfies Record<HeadingLevel, Component>;

export const HEADING_SHORTCUT_KEYS = {
    0: 'mod+alt+0',
    1: 'mod+alt+1',
    2: 'mod+alt+2',
    3: 'mod+alt+3',
    4: 'mod+alt+4',
    5: 'mod+alt+5',
    6: 'mod+alt+6',
} satisfies Record<HeadingLevel, string>;

export function canToggleHeading(editor: Editor | null, level?: HeadingLevel, turnInto = true) {
    if (
        !editor?.isEditable ||
        !isNodeInSchema(editor, 'heading') ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    if (!turnInto) {
        return level ? editor.can().setNode('heading', { level }) : editor.can().setNode('heading');
    }

    try {
        const { selection } = editor.view.state;
        if (selection.empty || isTextSelection(selection)) {
            const pos = findNodePosition(editor, { node: selection.$anchor.node(1) })?.pos;
            if (!isValidPosition(pos)) {
                return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}

export function isHeadingActive(editor: Editor | null, level?: HeadingLevel | HeadingLevel[]) {
    if (!editor?.isEditable) {
        return false;
    }

    if (Array.isArray(level)) {
        return level.some((l) => editor.isActive('heading', { level: l }));
    }

    return level ? editor.isActive('heading', { level }) : editor.isActive('heading');
}

export function toggleHeading(
    editor: Editor | null,
    level: HeadingLevel | HeadingLevel[],
): boolean {
    if (!editor?.isEditable) {
        return false;
    }

    const levels = Array.isArray(level) ? level : [level];
    const toggleLevel = levels.find((l) => canToggleHeading(editor, l));

    if (!toggleLevel) {
        return false;
    }

    try {
        const view = editor.view;
        let state = view.state;
        let tr = state.tr;

        const { selection } = editor.view.state;

        if (selection.empty || isTextSelection(selection)) {
            const pos = findNodePosition(editor, {
                node: selection.$anchor.node(1),
            })?.pos;
            if (!isValidPosition(pos)) {
                return false;
            }

            tr = tr.setSelection(NodeSelection.create(state.doc, pos));
            view.dispatch(tr);
            state = view.state;
        }

        let chain = editor.chain().focus();
        if (isNodeSelection(selection)) {
            const firstChild = selection.node.firstChild?.firstChild;
            const lastChild = selection.node.lastChild?.lastChild;

            const from = firstChild ? selection.from + firstChild.nodeSize : selection.from + 1;
            const to = lastChild ? selection.to - lastChild.nodeSize : selection.to - 1;

            chain = chain.setTextSelection({ from, to }).clearNodes();
        }

        const isActive = levels.some((l) => editor.isActive('heading', { level: l }));
        const toggle = isActive
            ? chain.setNode('paragraph')
            : chain.setNode('heading', { level: toggleLevel });
        toggle.run();
        editor.chain().focus().selectTextblockEnd().run();

        return true;
    } catch {
        return false;
    }
}

export function shouldShowHeadingToggle(
    editor: Editor | null,
    level: HeadingLevel | HeadingLevel[] | undefined,
    hideWhenUnavailable: boolean,
): boolean {
    if (!editor?.isEditable || !isNodeInSchema(editor, 'heading')) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        if (Array.isArray(level)) {
            return level.some((l) => canToggleHeading(editor, l));
        }
        return canToggleHeading(editor, level);
    }

    return true;
}

export function useHeading(config: UseHeadingConfig) {
    const editor = useTiptapEditor(config.editor);

    const canToggle = computed(() => canToggleHeading(editor.value, config.level));
    const isActive = computed(() => isHeadingActive(editor.value, config.level));
    const isVisible = computed(() =>
        shouldShowHeadingToggle(editor.value, config.level, config.hideWhenUnavailable ?? false),
    );

    const handleHeading = () => {
        const success = toggleHeading(editor.value, config.level);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label: `Heading ${config.level}`,
        icon: HEADING_ICONS[config.level],
        shortcutKeys: parseShortcutKeys(HEADING_SHORTCUT_KEYS[config.level]),
        handleHeading,
    };
}
