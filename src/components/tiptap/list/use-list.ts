import type { Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import { ListIcon, ListOrderedIcon, ListTodoIcon } from '@lucide/vue';
import { isTextSelection } from '@tiptap/vue-3';
import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import {
    findNodePosition,
    isNodeInSchema,
    isNodeTypeSelected,
    isValidPosition,
} from '@/lib/tiptap';
import { parseShortcutKeys } from '@/utils/shortcut';

export type ListType = 'bulletList' | 'orderedList' | 'taskList';

export interface UseListConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    type: MaybeRefOrGetter<ListType>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
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
    if (!editor) {
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
    editable = editor?.isEditable ?? false,
) {
    if (!editor || !isNodeInSchema(editor, type)) {
        return false;
    }

    if (hideWhenUnavailable && editable && !editor.isActive('code')) {
        return canToggleList(editor, type);
    }

    return true;
}

export function useList(config: UseListConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);
    const type = computed(() => toValue(config.type));

    const canToggle = computed(() => isEditable.value && canToggleList(editor.value, type.value));
    const isActive = computed(() => isListActive(editor.value, type.value));
    const isVisible = computed(() =>
        shouldShowListButton(
            editor.value,
            type.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );
    const label = computed(() => LIST_LABELS[type.value]);
    const icon = computed(() => LIST_ICONS[type.value]);
    const shortcutKeys = computed(() => parseShortcutKeys(LIST_SHORTCUT_KEYS[type.value]));

    const handleList = () => {
        const success = toggleList(editor.value, type.value);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label,
        icon,
        shortcutKeys,
        handleList,
    };
}
