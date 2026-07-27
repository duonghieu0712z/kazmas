import type { EditorState } from '@tiptap/pm/state';
import type { EditorOptions } from '@tiptap/vue-3';

import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import StarterKit from '@tiptap/starter-kit';

import { cn } from '@/lib/utils';

const defaultEditorClass = cn(
    'prose dark:prose-invert',
    'min-h-full w-full max-w-none px-4 py-2',
    'font-document wrap-break-word text-foreground outline-hidden',
);

const defaultEditorAttributes = {
    class: defaultEditorClass,
    spellCheck: 'false',
};

function createDefaultExtensions() {
    return [
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
    ];
}

function mergeEditorAttributes(attributes?: EditorOptions['editorProps']['attributes']) {
    if (typeof attributes === 'function') {
        return (state: EditorState) => {
            const resolvedAttributes = attributes(state);

            return {
                ...defaultEditorAttributes,
                ...resolvedAttributes,
                class: cn(defaultEditorClass, resolvedAttributes.class),
            };
        };
    }

    return {
        ...defaultEditorAttributes,
        ...attributes,
        class: cn(defaultEditorClass, attributes?.class),
    };
}

export function createEditorOptions(options: Partial<EditorOptions> = {}): Partial<EditorOptions> {
    return {
        ...options,
        extensions: options.extensions ?? createDefaultExtensions(),
        autofocus: options.autofocus ?? 'end',
        editable: options.editable ?? true,
        editorProps: {
            ...options.editorProps,
            attributes: mergeEditorAttributes(options.editorProps?.attributes),
        },
    };
}
