import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ListKit } from '@tiptap/extension-list';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import UniqueID from '@tiptap/extension-unique-id';
import StarterKit from '@tiptap/starter-kit';
import { all, createLowlight } from 'lowlight';

import { createEditorOptions } from '@/components/tiptap/editor';
import { TrailingParagraph } from '@/extensions/tiptap';
import { cn } from '@/lib/utils';

import { testEditorContent } from './content';

const lowlight = createLowlight(all);

export const testEditorOptions = createEditorOptions({
    content: testEditorContent,
    extensions: [
        StarterKit.configure({
            blockquote: {
                HTMLAttributes: {
                    class: cn('not-italic [&>p]:before:content-none [&>p]:after:content-none'),
                },
            },
            bulletList: false,
            code: {
                HTMLAttributes: {
                    class: cn(
                        'rounded-sm border px-[0.2em] py-[0.1em] font-code',
                        'before:content-none after:content-none',
                    ),
                },
            },
            codeBlock: false,
            heading: {
                levels: [1, 2, 3, 4],
            },
            link: {
                enableClickSelection: true,
                HTMLAttributes: {
                    target: null,
                },
                openOnClick: false,
            },
            listItem: false,
            listKeymap: false,
            orderedList: false,
            trailingNode: false,
        }),
        ListKit.configure({
            bulletList: {
                HTMLAttributes: {
                    class: cn('[&>li]:my-0 [&>li>p]:m-0'),
                },
            },
            orderedList: {
                HTMLAttributes: {
                    class: cn('[&>li]:my-0 [&>li>p]:m-0'),
                },
            },
            taskItem: {
                nested: true,
            },
            taskList: {
                HTMLAttributes: {
                    class: cn(
                        'pl-[0.25em]',
                        '[&>li]:my-0 [&>li]:flex [&>li]:flex-row [&>li]:items-start',
                        '[&>li:not(:has(>p:first-child))]:list-none',
                        '[&>li[data-checked=true]>div>p]:opacity-50',
                        '[&>li[data-checked=true]>div>p]:line-through',
                        '[&>li[data-checked=true]>div>p_span]:line-through',
                        '[&>li>label]:relative [&>li>label]:pt-1.5 [&>li>label]:pr-2',
                        '[&>li>label>input[type=checkbox]]:absolute',
                        '[&>li>label>input[type=checkbox]]:size-0',
                        '[&>li>label>input[type=checkbox]]:opacity-0',
                        '[&>li>label>span]:relative [&>li>label>span]:block',
                        '[&>li>label>span]:size-[1em] [&>li>label>span]:cursor-pointer',
                        '[&>li>label>span]:rounded-sm [&>li>label>span]:border',
                        '[&>li>label>span]:border-input [&>li>label>span]:bg-background',
                        '[&>li>label>span]:transition-colors',
                        '[&>li>label>span]:duration-75',
                        '[&>li>label>span::before]:absolute',
                        '[&>li>label>span::before]:top-1/2',
                        '[&>li>label>span::before]:left-1/2',
                        '[&>li>label>span::before]:h-[0.5em]',
                        '[&>li>label>span::before]:w-[0.25em]',
                        '[&>li>label>span::before]:-translate-x-1/2',
                        '[&>li>label>span::before]:translate-y-[-60%]',
                        '[&>li>label>span::before]:rotate-45',
                        '[&>li>label>span::before]:border-r-2',
                        '[&>li>label>span::before]:border-b-2',
                        '[&>li>label>span::before]:border-primary-foreground',
                        '[&>li>label>span::before]:opacity-0',
                        '[&>li>label>span::before]:content-[""]',
                        '[&>li>label>input[type=checkbox]:checked+span]:border-primary',
                        '[&>li>label>input[type=checkbox]:checked+span]:bg-primary',
                        '[&>li>label>input[type=checkbox]:checked+span::before]:opacity-100',
                        '[&>li>div]:min-w-0 [&>li>div]:flex-1',
                        '[&>li>div>p]:m-0',
                    ),
                },
            },
        }),
        CodeBlockLowlight.configure({
            lowlight,
            defaultLanguage: 'plaintext',
            HTMLAttributes: {
                class: cn('rounded-sm border bg-muted font-code'),
            },
            enableTabIndentation: true,
        }),
        Placeholder.configure({
            placeholder: 'Write something …',
            emptyEditorClass: cn(
                'before:pointer-events-none before:float-left before:h-0 before:text-muted-foreground before:content-[attr(data-placeholder)]',
            ),
            emptyNodeClass: cn(
                'before:pointer-events-none before:float-left before:h-0 before:text-muted-foreground before:content-[attr(data-placeholder)]',
            ),
        }),
        Subscript,
        Superscript,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
            defaultAlignment: 'left',
        }),
        TrailingParagraph,
        UniqueID.configure({
            types: 'all',
        }),
    ],
    onUpdate: ({ editor }) => {
        console.log(editor.getJSON());
    },
});
