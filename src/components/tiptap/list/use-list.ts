import type { Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import { ListIcon, ListOrderedIcon, ListTodoIcon } from '@lucide/vue';
import { isTextSelection } from '@tiptap/vue-3';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import {
    findNodePosition,
    isNodeInSchema,
    isNodeTypeSelected,
    isValidPosition,
    parseShortcutKeys,
} from '@/lib/tiptap';

export type ListType = 'bulletList' | 'orderedList' | 'taskList';

export interface UseListConfig {
    editor?: MaybeRefOrGetter<Editor>;
    type: ListType;
    hideWhenUnavailable?: boolean;
    onToggled?: () => void;
}

export const LIST_ICONS = {
    bulletList: ListIcon,
    orderedList: ListOrderedIcon,
    taskList: ListTodoIcon,
} satisfies Record<ListType, Component>;

export const LIST_LABELS = {
    bulletList: 'Bullet list',
    orderedList: 'Ordered list',
    taskList: 'Task list',
} satisfies Record<ListType, string>;

export const LIST_SHORTCUT_KEYS = {
    bulletList: 'mod+shift+8',
    orderedList: 'mod+shift+7',
    taskList: 'mod+shift+9',
} satisfies Record<ListType, string>;

export function canToggleList(editor: Editor | null, type: ListType, turnInto = true) {
    if (
        !editor?.isEditable ||
        !isNodeInSchema(editor, type) ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    if (!turnInto) {
        switch (type) {
            case 'bulletList':
                return editor.can().toggleBulletList();
            case 'orderedList':
                return editor.can().toggleOrderedList();
            case 'taskList':
                return editor.can().toggleList('taskList', 'taskItem');
        }
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

export function isListActive(editor: Editor | null, type: ListType) {
    if (!editor?.isEditable) {
        return false;
    }

    return editor.isActive(type);
}

export function toggleList(editor: Editor | null, type: ListType) {
    if (!editor?.isEditable || !canToggleList(editor, type)) {
        return false;
    }

    try {
        if (editor.isActive(type)) {
            const itemType = type === 'taskList' ? 'taskItem' : 'listItem';
            return editor.chain().focus().liftListItem(itemType).run();
        }

        switch (type) {
            case 'bulletList':
                return editor.chain().focus().toggleBulletList().run();
            case 'orderedList':
                return editor.chain().focus().toggleOrderedList().run();
            case 'taskList':
                return editor.chain().focus().toggleList('taskList', 'taskItem').run();
        }
    } catch {
        return false;
    }
}

export function shouldShowListButton(
    editor: Editor | null,
    type: ListType,
    hideWhenUnavailable: boolean,
) {
    if (!editor?.isEditable || !isNodeInSchema(editor, type)) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canToggleList(editor, type);
    }

    return true;
}

export function useList(config: UseListConfig) {
    const editor = useTiptapEditor(config.editor);

    const canToggle = computed(() => canToggleList(editor.value, config.type));
    const isActive = computed(() => isListActive(editor.value, config.type));
    const isVisible = computed(() =>
        shouldShowListButton(editor.value, config.type, config.hideWhenUnavailable ?? false),
    );

    const handleList = () => {
        const success = toggleList(editor.value, config.type);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label: LIST_LABELS[config.type],
        icon: LIST_ICONS[config.type],
        shortcutKeys: parseShortcutKeys(LIST_SHORTCUT_KEYS[config.type]),
        handleList,
    };
}
