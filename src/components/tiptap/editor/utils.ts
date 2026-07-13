import type { Editor } from '@tiptap/vue-3';

import { createContext } from 'reka-ui';

export const [useTiptapEditor, provideTiptapEditorContext] = createContext<{
    editor: ShallowRef<Editor | undefined>;
}>('TiptapEditor');
