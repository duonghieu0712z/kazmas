<script setup lang="ts">
import type { Content } from '@tiptap/vue-3';

import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';

import { createEditorOptions } from '@/components/tiptap/editor';
import { TrailingParagraph } from '@/extensions/tiptap';
import { cn } from '@/lib/utils';

import TestToolbar from './TestToolbar.vue';

const content: Content = {
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
                { type: 'text', text: 'subscript', marks: [{ type: 'subscript' }] },
                { type: 'text', text: ', and ' },
                { type: 'text', text: 'superscript', marks: [{ type: 'superscript' }] },
                { type: 'text', text: ' marks are available here.' },
            ],
        },
    ],
};

const options = createEditorOptions({
    content,
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
</script>

<template>
    <div class="flex h-full min-w-0 flex-col overflow-hidden">
        <EditorProvider :options="options">
            <TestToolbar />

            <ScrollArea class="min-h-0 min-w-0 flex-1 overflow-hidden" horizontal>
                <div class="flex min-h-full w-full min-w-max items-stretch justify-center p-2">
                    <EditorContent class="w-3xl shrink-0 cursor-text self-stretch border" />
                </div>
            </ScrollArea>
        </EditorProvider>
    </div>
</template>
