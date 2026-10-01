import type { Editor } from '@tiptap/vue-3';

export { default as EditorContent } from './EditorContent.vue';
export { default as EditorProvider } from './EditorProvider.vue';

export { useTiptapEditor } from './context';
export { createEditorOptions } from './options';

export interface TiptapEditorProps {
    editor?: Editor;
}

export interface TiptapControlProps extends TiptapEditorProps {
    hideWhenUnavailable?: boolean;
}
