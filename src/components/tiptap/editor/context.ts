import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue';

import { createContext } from 'reka-ui';
import { computed, toValue } from 'vue';

export const [injectTiptapEditorContext, provideTiptapEditorContext] = createContext<{
    editor: ShallowRef<Editor | undefined>;
    isEditable: Readonly<Ref<boolean>>;
    setEditable: (editable: boolean, emitUpdate?: boolean) => boolean;
}>('TiptapEditor');

export function useTiptapEditor(editor?: MaybeRefOrGetter<Editor | undefined>) {
    const context = injectTiptapEditorContext(null);

    const currentEditor = computed(() => toValue(editor) ?? context?.editor.value ?? null);
    const isEditable = computed(() => {
        if (!currentEditor.value) {
            return false;
        }

        return currentEditor.value === context?.editor.value
            ? context.isEditable.value
            : currentEditor.value.isEditable;
    });

    const setEditable = (editable: boolean, emitUpdate = true) => {
        const editor = currentEditor.value;
        if (!editor || editor.isDestroyed) {
            return false;
        }

        if (editor === context?.editor.value) {
            return context.setEditable(editable, emitUpdate);
        }

        editor.setEditable(editable, emitUpdate);
        return true;
    };

    return {
        editor: currentEditor,
        isEditable,
        setEditable,
    };
}
