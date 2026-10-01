import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue';

import { createContext } from 'reka-ui';
import { computed, ref, toValue, watch } from 'vue';

export const [injectTiptapEditorContext, provideTiptapEditorContext] = createContext<{
    editor: ShallowRef<Editor | undefined>;
    isEditable: Readonly<Ref<boolean>>;
    setEditable: (editable: boolean, emitUpdate?: boolean) => boolean;
}>('TiptapEditor');

export function useTiptapEditor(editor?: MaybeRefOrGetter<Editor | undefined>) {
    const context = injectTiptapEditorContext(null);

    const currentEditor = computed(() => toValue(editor) ?? context?.editor.value ?? null);
    const externalIsEditable = ref(false);
    const isEditable = computed(() => {
        if (!currentEditor.value) {
            return false;
        }

        return currentEditor.value === context?.editor.value
            ? context.isEditable.value
            : externalIsEditable.value;
    });

    watch(
        currentEditor,
        (editor, _previousEditor, onCleanup) => {
            if (!editor || editor === context?.editor.value) {
                externalIsEditable.value = false;
                return;
            }

            const syncEditable = () => {
                externalIsEditable.value = editor.isEditable;
            };

            syncEditable();
            editor.on('update', syncEditable);
            onCleanup(() => editor.off('update', syncEditable));
        },
        { immediate: true },
    );

    const setEditable = (editable: boolean, emitUpdate = true) => {
        const editor = currentEditor.value;
        if (!editor || editor.isDestroyed) {
            return false;
        }

        if (editor === context?.editor.value) {
            return context.setEditable(editable, emitUpdate);
        }

        editor.setEditable(editable, emitUpdate);
        externalIsEditable.value = editor.isEditable;
        return true;
    };

    return {
        editor: currentEditor,
        isEditable,
        setEditable,
    };
}
