<script setup lang="ts">
import type { Editor, EditorOptions } from '@tiptap/vue-3';

import { useEditor } from '@tiptap/vue-3';

import { provideTiptapEditorContext } from './context';

const props = defineProps<{
    options?: Partial<EditorOptions>;
}>();

defineSlots<{
    default?: (props: { editor?: Editor }) => any;
}>();

const editor = useEditor(props.options);
const isEditable = ref(false);

function syncEditable() {
    isEditable.value = editor.value?.isEditable ?? false;
}

function setEditable(editable: boolean, emitUpdate = true) {
    const currentEditor = editor.value;
    if (!currentEditor || currentEditor.isDestroyed) {
        return false;
    }

    currentEditor.setEditable(editable, emitUpdate);
    syncEditable();
    return true;
}

watch(
    editor,
    (currentEditor, _previousEditor, onCleanup) => {
        syncEditable();
        currentEditor?.on('update', syncEditable);
        onCleanup(() => currentEditor?.off('update', syncEditable));
    },
    { immediate: true },
);

provideTiptapEditorContext({
    editor,
    isEditable: readonly(isEditable),
    setEditable,
});
</script>

<template>
    <slot :editor="editor" />
</template>
