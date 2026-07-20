import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter, ShallowRef } from 'vue';

import { createContext } from 'reka-ui';
import { computed, toValue } from 'vue';

export const [injectTiptapEditorContext, provideTiptapEditorContext] = createContext<{
    editor: ShallowRef<Editor | undefined>;
}>('TiptapEditor');

export function useTiptapEditor(editor?: MaybeRefOrGetter<Editor | undefined>) {
    const context = injectTiptapEditorContext(null);
    return computed(() => toValue(editor) ?? context?.editor.value ?? null);
}
