import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';

export type DocumentTextSizeValue = 0.75 | 0.875 | 1 | 1.125 | 1.25;

export const DOCUMENT_TEXT_SIZES: DocumentTextSizeValue[] = [0.75, 0.875, 1, 1.125, 1.25];

export function isDocumentTextSize(value: unknown): value is DocumentTextSizeValue {
    return DOCUMENT_TEXT_SIZES.some((size) => size === value);
}

export function resolveDocumentTextSize(value: unknown): DocumentTextSizeValue {
    return isDocumentTextSize(value) ? value : 1;
}

declare module '@tiptap/vue-3' {
    interface Commands<ReturnType> {
        documentTextSize: {
            setDocumentTextSize: (textSize: DocumentTextSizeValue) => ReturnType;
        };
    }
}

export const DocumentTextSize = Extension.create({
    name: 'documentTextSize',

    addGlobalAttributes() {
        return [
            {
                types: ['doc'],
                attributes: {
                    textSize: {
                        default: 1,
                        rendered: false,
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setDocumentTextSize:
                (textSize) =>
                ({ editor, tr, dispatch }) => {
                    if (!editor.isEditable || !isDocumentTextSize(textSize)) {
                        return false;
                    }

                    if (dispatch && tr.doc.attrs.textSize !== textSize) {
                        tr.setDocAttribute('textSize', textSize);
                    }

                    return true;
                },
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey(this.name),
                props: {
                    attributes: (state) => ({
                        style: `font-size: ${resolveDocumentTextSize(state.doc.attrs.textSize)}rem`,
                    }),
                },
            }),
        ];
    },
});
