import type { EditorState, Transaction } from '@tiptap/pm/state';

import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';

function createTrailingParagraphTransaction(state: EditorState): Transaction | null {
    const { doc, schema } = state;
    const paragraph = schema.nodes.paragraph;
    const lastNode = doc.lastChild;

    if (
        !paragraph ||
        doc.textContent.length === 0 ||
        !doc.canReplaceWith(doc.childCount, doc.childCount, paragraph) ||
        (lastNode?.type === paragraph && lastNode.content.size === 0)
    ) {
        return null;
    }

    return state.tr.insert(doc.content.size, paragraph.create());
}

export const TrailingParagraph = Extension.create({
    name: 'trailingParagraph',

    onCreate() {
        const transaction = createTrailingParagraphTransaction(this.editor.state);
        if (transaction) {
            this.editor.view.dispatch(transaction.setMeta('addToHistory', false));
        }
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey(this.name),
                appendTransaction: (transactions, _, state) => {
                    if (!transactions.some((transaction) => transaction.docChanged)) {
                        return null;
                    }

                    return createTrailingParagraphTransaction(state);
                },
            }),
        ];
    },
});
