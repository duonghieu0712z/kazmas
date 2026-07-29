import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';

import { createEditorOptions } from '@/components/tiptap/editor';
import { TrailingParagraph } from '@/extensions/tiptap';
import { cn } from '@/lib/utils';

import { testEditorContent } from './content';

export const testEditorOptions = createEditorOptions({
    content: testEditorContent,
    extensions: [
        StarterKit.configure({
            blockquote: {
                HTMLAttributes: {
                    class: cn('not-italic [&>p]:before:content-none [&>p]:after:content-none'),
                },
            },
            code: {
                HTMLAttributes: {
                    class: cn(
                        'rounded-sm border px-[0.2em] py-[0.1em] font-code',
                        'before:content-none after:content-none',
                    ),
                },
            },
            codeBlock: {
                HTMLAttributes: {
                    class: cn('rounded-sm border font-code'),
                },
            },
            heading: {
                levels: [1, 2, 3, 4],
            },
            trailingNode: false,
        }),
        Subscript,
        Superscript,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        TrailingParagraph,
    ],
    onUpdate: ({ editor }) => {
        console.log(editor.getJSON());
    },
});
