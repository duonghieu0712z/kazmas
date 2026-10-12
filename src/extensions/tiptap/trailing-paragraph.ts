import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Extension } from '@tiptap/vue-3';

export const TrailingParagraph = Extension.create({
    name: 'trailingParagraph',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey(this.name),
                props: {
                    handleDOMEvents: {
                        mousedown: (view, event) => {
                            const lastElement = view.dom.lastElementChild;
                            if (
                                event.button !== 0 ||
                                !view.editable ||
                                !lastElement ||
                                event.clientY <= lastElement.getBoundingClientRect().bottom
                            ) {
                                return false;
                            }

                            const { doc, schema } = view.state;
                            const paragraph = schema.nodes.paragraph;
                            const lastNode = doc.lastChild;

                            if (!paragraph) {
                                return false;
                            }

                            if (lastNode?.type === paragraph && lastNode.content.size === 0) {
                                event.preventDefault();
                                view.dispatch(
                                    view.state.tr
                                        .setSelection(TextSelection.atEnd(doc))
                                        .scrollIntoView(),
                                );
                                view.focus();

                                return true;
                            }

                            if (!doc.canReplaceWith(doc.childCount, doc.childCount, paragraph)) {
                                return false;
                            }

                            event.preventDefault();

                            const position = doc.content.size;
                            const transaction = view.state.tr.insert(position, paragraph.create());
                            transaction
                                .setSelection(
                                    TextSelection.near(transaction.doc.resolve(position + 1)),
                                )
                                .scrollIntoView();

                            view.dispatch(transaction);
                            view.focus();

                            return true;
                        },
                    },
                },
            }),
        ];
    },
});
