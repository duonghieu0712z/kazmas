import type { Editor } from '@tiptap/vue-3';

import { isMacOS, isNodeSelection } from '@tiptap/vue-3';

const MAC_SYMBOLS: Record<string, string> = {
    mod: '⌘',
    command: '⌘',
    meta: '⌘',
    ctrl: '⌃',
    control: '⌃',
    alt: '⌥',
    option: '⌥',
    shift: '⇧',
    backspace: '⌫',
    delete: '⌦',
    enter: '⏎',
    escape: '⎋',
    capslock: '⇪',
} as const;

export function formatShortcutKey(key: string, isMac: boolean, capitalize = true) {
    if (isMac) {
        const lowerKey = key.toLowerCase();
        return MAC_SYMBOLS[lowerKey] || (capitalize ? key.toUpperCase() : key);
    }

    switch (key) {
        case 'mod':
        case 'meta':
        case 'command':
            key = 'ctrl';
            break;
        case 'option':
            key = 'alt';
            break;
    }
    return capitalize ? key.replace(/^./, (c) => c.toUpperCase()) : key;
}

export function parseShortcutKeys(shortcutKeys: string, delimiter = '+', capitalize = true) {
    return shortcutKeys
        .split(delimiter)
        .map((key) => formatShortcutKey(key.trim(), isMacOS(), capitalize));
}

export function isMarkInSchema(editor: Editor | null, markName: string) {
    if (!editor?.schema) {
        return false;
    }
    return editor.schema.spec.marks.get(markName) !== undefined;
}

export function isNodeInSchema(editor: Editor | null, nodeName: string) {
    if (!editor?.schema) {
        return false;
    }
    return editor.schema.spec.nodes.get(nodeName) !== undefined;
}

export function isNodeTypeSelected(editor: Editor | null, types: string[] = []) {
    if (!editor?.state.selection) {
        return false;
    }

    const { selection } = editor.state;
    if (selection.empty) {
        return false;
    }

    if (isNodeSelection(selection)) {
        const node = selection.node;
        return node ? types.includes(node.type.name) : false;
    }

    return false;
}
