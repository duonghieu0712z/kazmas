import CharacterCount from '@tiptap/extension-character-count';
import FindAndReplace from '@tiptap/extension-find-and-replace';
import InvisibleCharacters from '@tiptap/extension-invisible-characters';
import { ListKit } from '@tiptap/extension-list';
import Placeholder from '@tiptap/extension-placeholder';
import RubyText from '@tiptap/extension-ruby-text';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import UniqueID from '@tiptap/extension-unique-id';
import StarterKit from '@tiptap/starter-kit';
import { all, createLowlight } from 'lowlight';

import { ActiveMark, CodeBlockLowlight, TrailingParagraph } from '@/extensions/tiptap';
import { cn } from '@/lib/utils';

const lowlight = createLowlight(all);

export function createEditorExtensions() {
    return [
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
                        'rounded-sm border border-inline-code-border bg-inline-code-background px-[0.2em] py-[0.1em] font-code',
                        'before:content-none after:content-none',
                    ),
                },
            },
            codeBlock: false,
            heading: {
                levels: [1, 2, 3, 4],
            },
            link: {
                enableClickSelection: false,
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
        ActiveMark.configure({
            HTMLAttributes: {
                class: cn('bg-editor-active-mark'),
            },
            types: ['link', 'rubyText'],
        }),
        CharacterCount,
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
                        '[&>li>label::before]:block',
                        '[&>li>label::before]:size-[1em] [&>li>label::before]:cursor-pointer',
                        '[&>li>label::before]:rounded-sm [&>li>label::before]:border',
                        '[&>li>label::before]:border-border [&>li>label::before]:bg-background',
                        '[&>li>label::before]:transition-colors',
                        '[&>li>label::before]:duration-75',
                        '[&>li>label::before]:content-[""]',
                        '[&>li>label::after]:absolute',
                        '[&>li>label::after]:top-[calc(0.375rem+0.5em)]',
                        '[&>li>label::after]:left-[0.5em]',
                        '[&>li>label::after]:h-[0.5em]',
                        '[&>li>label::after]:w-[0.25em]',
                        '[&>li>label::after]:-translate-x-1/2',
                        '[&>li>label::after]:translate-y-[-60%]',
                        '[&>li>label::after]:rotate-45',
                        '[&>li>label::after]:border-r-2',
                        '[&>li>label::after]:border-b-2',
                        '[&>li>label::after]:border-background',
                        '[&>li>label::after]:opacity-0',
                        '[&>li>label::after]:content-[""]',
                        '[&>li>label:has(>input[type=checkbox]:checked)::before]:border-foreground',
                        '[&>li>label:has(>input[type=checkbox]:checked)::before]:bg-foreground',
                        '[&>li>label:has(>input[type=checkbox]:checked)::after]:opacity-100',
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
                class: cn(
                    'rounded-sm border border-code-block-border bg-code-block-background font-code text-code-block-foreground',
                ),
            },
            enableTabIndentation: true,
        }),
        FindAndReplace.configure({
            injectCSS: false,
        }),
        InvisibleCharacters.configure({
            visible: false,
        }),
        Placeholder.configure({
            placeholder: 'Write something...',
            emptyEditorClass: cn(
                'before:pointer-events-none before:float-left before:h-0 before:text-editor-placeholder before:content-[attr(data-placeholder)]',
            ),
            emptyNodeClass: cn(
                'before:pointer-events-none before:float-left before:h-0 before:text-editor-placeholder before:content-[attr(data-placeholder)]',
            ),
        }),
        RubyText.configure({
            allowClickToEdit: true,
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
    ];
}
