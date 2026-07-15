import type { Editor } from '@tiptap/vue-3';

import { createContext } from 'reka-ui';

export const [injectTiptapEditorContext, provideTiptapEditorContext] = createContext<{
    editor: ShallowRef<Editor | undefined>;
}>('TiptapEditor');

export function useTiptapEditor(editor?: MaybeRefOrGetter<Editor | undefined>) {
    const context = injectTiptapEditorContext(null);
    return computed(() => toValue(editor) ?? context?.editor.value);
}
