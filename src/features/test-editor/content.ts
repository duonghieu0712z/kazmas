import type { Content } from '@tiptap/vue-3';

export const testEditorContent: Content = {
    type: 'doc',
    content: [
        {
            type: 'heading',
            attrs: { level: 1, textAlign: 'center' },
            content: [{ type: 'text', text: 'Test editor' }],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'This document is local and is not connected to nodes.' },
            ],
        },
        {
            type: 'paragraph',
            attrs: { textAlign: 'right' },
            content: [{ type: 'text', text: 'This paragraph is right aligned.' }],
        },
        {
            type: 'blockquote',
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Blockquotes are available here.' }],
                },
            ],
        },
        {
            type: 'codeBlock',
            attrs: {
                language: 'javascript',
            },
            content: [
                {
                    type: 'text',
                    text: "const message = 'Code blocks are available here.';\nconsole.log(message);",
                },
            ],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'underline', marks: [{ type: 'underline' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'strike', marks: [{ type: 'strike' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'code', marks: [{ type: 'code' }] },
                { type: 'text', text: ', ' },
                {
                    type: 'text',
                    text: 'link',
                    marks: [{ type: 'link', attrs: { href: 'https://tiptap.dev' } }],
                },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'subscript', marks: [{ type: 'subscript' }] },
                { type: 'text', text: ', and ' },
                { type: 'text', text: 'superscript', marks: [{ type: 'superscript' }] },
                { type: 'text', text: ' marks are available here.' },
            ],
        },
        {
            type: 'paragraph',
            content: [
                {
                    type: 'text',
                    text: '東京',
                    marks: [{ type: 'rubyText', attrs: { rt: 'とうきょう' } }],
                },
                { type: 'text', text: 'は日本の首都です。' },
            ],
        },
        {
            type: 'bulletList',
            content: [
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Bullet list item' }],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Another bullet list item' }],
                        },
                    ],
                },
            ],
        },
        {
            type: 'orderedList',
            content: [
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'First ordered list item' }],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Second ordered list item' }],
                        },
                    ],
                },
            ],
        },
        {
            type: 'taskList',
            content: [
                {
                    type: 'taskItem',
                    attrs: { checked: true },
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Completed task' }],
                        },
                    ],
                },
                {
                    type: 'taskItem',
                    attrs: { checked: false },
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Pending task' }],
                        },
                    ],
                },
            ],
        },
    ],
};
