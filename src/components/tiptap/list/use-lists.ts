import type { ListType } from './use-list';
import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { ListIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeInSchema, parseShortcutKeys } from '@/lib/tiptap';

import {
    canToggleList,
    isListActive,
    LIST_ICONS,
    LIST_LABELS,
    LIST_SHORTCUT_KEYS,
    toggleList,
} from './use-list';

export interface UseListsConfig {
    editor?: MaybeRefOrGetter<Editor>;
    types?: ListType[];
    hideWhenUnavailable?: boolean;
    onToggled?: (type: ListType) => void;
}

export const DEFAULT_LIST_TYPES: ListType[] = ['bulletList', 'orderedList', 'taskList'];

export function getActiveListType(editor: Editor | null, types: ListType[] = DEFAULT_LIST_TYPES) {
    return types.find((type) => isListActive(editor, type));
}

export function canToggleAnyList(editor: Editor | null, types: ListType[]) {
    return types.some((type) => canToggleList(editor, type));
}

export function shouldShowLists(
    editor: Editor | null,
    types: ListType[],
    hideWhenUnavailable: boolean,
) {
    if (!editor?.isEditable || !types.some((type) => isNodeInSchema(editor, type))) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canToggleAnyList(editor, types);
    }

    return true;
}

export function useLists(config: UseListsConfig) {
    const editor = useTiptapEditor(config.editor);
    const types = computed(() => config.types ?? DEFAULT_LIST_TYPES);
    const activeType = computed(() => getActiveListType(editor.value, types.value));
    const canToggle = computed(() => canToggleAnyList(editor.value, types.value));
    const isVisible = computed(() =>
        shouldShowLists(editor.value, types.value, config.hideWhenUnavailable ?? false),
    );
    const label = computed(() => (activeType.value ? LIST_LABELS[activeType.value] : 'List'));
    const icon = computed(() => (activeType.value ? LIST_ICONS[activeType.value] : ListIcon));

    const getLabel = (type: ListType) => LIST_LABELS[type];
    const getIcon = (type: ListType) => LIST_ICONS[type];
    const getShortcutKeys = (type: ListType) => parseShortcutKeys(LIST_SHORTCUT_KEYS[type]);
    const canToggleType = (type: ListType) => canToggleList(editor.value, type);
    const handleList = (type: ListType) => {
        const success = toggleList(editor.value, type);
        if (success) {
            config.onToggled?.(type);
        }
        return success;
    };

    return {
        activeType,
        canToggle,
        isVisible,
        label,
        icon,
        types,
        getLabel,
        getIcon,
        getShortcutKeys,
        canToggleType,
        handleList,
    };
}
