import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { EyeIcon, PencilIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseEditableConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    onChanged?: (editable: boolean) => void;
}

export const ENABLE_EDITING_LABEL = 'Enable editing';
export const DISABLE_EDITING_LABEL = 'Switch to read-only';

export function canSetEditable(editor: Editor | null) {
    return Boolean(editor && !editor.isDestroyed);
}

export function useEditable(config: UseEditableConfig) {
    const { editor, isEditable, setEditable } = useTiptapEditor(config.editor);

    const canToggle = computed(() => canSetEditable(editor.value));
    const label = computed(() => (isEditable.value ? DISABLE_EDITING_LABEL : ENABLE_EDITING_LABEL));
    const icon = computed(() => (isEditable.value ? PencilIcon : EyeIcon));

    const handleEditable = () => {
        const editable = !isEditable.value;
        const success = setEditable(editable);
        if (success) {
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
