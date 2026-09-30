import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { EyeIcon, PencilIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseEditableConfig {
    editor?: MaybeRefOrGetter<Editor>;
    onChanged?: (editable: boolean) => void;
}

export const ENABLE_EDITING_LABEL = 'Enable editing';
export const DISABLE_EDITING_LABEL = 'Switch to read-only';

export function canSetEditable(editor: Editor | null) {
    return Boolean(editor && !editor.isDestroyed);
}

export function setEditable(editor: Editor | null, editable: boolean) {
    if (!editor || !canSetEditable(editor)) {
        return false;
    }

    editor.setEditable(editable);
    return true;
}

export function useEditable(config: UseEditableConfig) {
    const editor = useTiptapEditor(config.editor);
    const isEditable = ref(false);

    const canToggle = computed(() => canSetEditable(editor.value));
    const label = computed(() => (isEditable.value ? DISABLE_EDITING_LABEL : ENABLE_EDITING_LABEL));
    const icon = computed(() => (isEditable.value ? PencilIcon : EyeIcon));

    watch(
        editor,
        (currentEditor) => {
            isEditable.value = currentEditor?.isEditable ?? false;
        },
        { immediate: true },
    );

    const handleEditable = () => {
        const editable = !isEditable.value;
        const success = setEditable(editor.value, editable);
        if (success) {
            isEditable.value = editable;
            config.onChanged?.(editable);
        }
        return success;
    };

    return {
        isEditable,
        canToggle,
        label,
        icon,
        handleEditable,
    };
}
