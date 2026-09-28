import { createEditorOptions } from '@/components/tiptap/editor';
import { createEditorExtensions } from '@/features/editor/options';

import { testEditorContent } from './content';

export const testEditorOptions = createEditorOptions({
    content: testEditorContent,
    extensions: createEditorExtensions(),
    onUpdate: ({ editor }) => {
        console.log(editor.getJSON());
    },
});
