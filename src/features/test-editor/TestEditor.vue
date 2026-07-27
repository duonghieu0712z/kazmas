<script setup lang="ts">
import type { Content, EditorOptions } from '@tiptap/vue-3';

import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import StarterKit from '@tiptap/starter-kit';

import { cn } from '@/lib/utils';

const content: Content = {
    type: 'doc',
    content: [
        {
            type: 'heading',
            attrs: { level: 1 },
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
            content: [
                { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'underline', marks: [{ type: 'underline' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'strike', marks: [{ type: 'strike' }] },
                { type: 'text', text: ', and ' },
                { type: 'text', text: 'code', marks: [{ type: 'code' }] },
                { type: 'text', text: ', ' },
                { type: 'text', text: 'subscript', marks: [{ type: 'subscript' }] },
                { type: 'text', text: ', and ' },
                { type: 'text', text: 'superscript', marks: [{ type: 'superscript' }] },
                { type: 'text', text: ' marks are available here.' },
            ],
        },
        {
            type: 'paragraph',
        },
    ],
};

const options: Partial<EditorOptions> = {
    content,
    extensions: [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3, 4],
            },
            code: {
                HTMLAttributes: {
                    class: cn(
                        'rounded-sm border px-[0.2em] py-[0.1em] font-code before:content-none after:content-none',
                    ),
                },
            },
        }),
        Subscript,
        Superscript,
    ],
    autofocus: 'end',
    editable: true,
    editorProps: {
        attributes: {
            class: cn(
                'prose dark:prose-invert',
                'min-h-full w-full max-w-none px-4 py-2',
                'font-document wrap-break-word text-foreground outline-hidden',
            ),
            spellCheck: 'false',
        },
    },
    onUpdate: ({ editor }) => {
        console.log(editor.getJSON());
    },
};

const marks = ['bold', 'italic', 'underline', 'strike'] as const;
const codeAndScriptMarks = ['code', 'subscript', 'superscript'] as const;
const headingLevels = [1, 2, 3, 4] as const;
</script>

<template>
    <EditorProvider
        v-slot="{ editor }"
        class="flex h-full min-w-0 flex-col overflow-hidden"
        :options="options"
    >
        <ButtonGroup
            class="h-9 w-full shrink-0 items-center border-b px-2 has-[>[data-slot=button-group]]:gap-0.5"
            spacing="spaced"
        >
            <ButtonGroup spacing="spaced">
                <UndoRedoButton action="undo" />
                <UndoRedoButton action="redo" />
            </ButtonGroup>

            <ButtonGroupSeparator class="my-1" />

            <ButtonGroup spacing="spaced">
                <HeadingToggle v-for="level in headingLevels" :key="level" :level="level" />
            </ButtonGroup>

            <ButtonGroupSeparator class="my-1" />

            <ButtonGroup spacing="spaced">
                <MarkToggle v-for="mark in marks" :key="mark" :type="mark" />
            </ButtonGroup>

            <ButtonGroupSeparator class="my-1" />

            <ButtonGroup spacing="spaced">
                <MarkToggle v-for="mark in codeAndScriptMarks" :key="mark" :type="mark" />
            </ButtonGroup>
        </ButtonGroup>

        <ScrollArea
            class="m-2 min-h-0 min-w-0 flex-1 cursor-text overflow-hidden border"
            @click="editor?.chain().focus('end').run()"
        >
            <EditorContent class="min-h-full w-full" @click.stop.prevent />
        </ScrollArea>
    </EditorProvider>
</template>
