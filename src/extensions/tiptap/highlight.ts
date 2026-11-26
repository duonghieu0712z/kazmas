import TiptapHighlight from '@tiptap/extension-highlight';
import { getStyleProperty, isValidCSSStyleValue } from '@tiptap/vue-3';

export const Highlight = TiptapHighlight.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            textColor: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute('data-text-color') || getStyleProperty(element, 'color'),
                renderHTML: (attributes) => {
                    if (!isValidCSSStyleValue(attributes.textColor)) {
                        return {};
                    }

                    return {
                        'data-text-color': attributes.textColor,
                        style: `color: ${attributes.textColor}`,
                    };
                },
            },
        };
    },
});
