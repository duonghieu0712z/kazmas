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

import {
    findNodePosition,
    isNodeInSchema,
    isNodeTypeSelected,
    isValidPosition,
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

export function canToggleHeading(level?: HeadingLevel, turnInto = true, editor?: Editor) {
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

export function isHeadingActive(level?: HeadingLevel | HeadingLevel[], editor?: Editor) {
    if (!editor?.isEditable) {
        return false;
    }

    if (Array.isArray(level)) {
        return level.some((l) => editor.isActive('heading', { level: l }));
    }

    return level ? editor.isActive('heading', { level }) : editor.isActive('heading');
}

export function toggleHeading(level: HeadingLevel | HeadingLevel[], editor?: Editor): boolean {
    if (!editor?.isEditable) {
        return false;
    }

    const levels = Array.isArray(level) ? level : [level];
    const toggleLevel = levels.find((l) => canToggleHeading(l, true, editor));

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
