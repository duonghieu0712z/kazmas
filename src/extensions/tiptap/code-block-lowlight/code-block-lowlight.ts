import TiptapCodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import CodeBlockView from './CodeBlockView.vue';

export const CodeBlockLowlight = TiptapCodeBlockLowlight.extend({
    addNodeView() {
        return VueNodeViewRenderer(CodeBlockView, {
            contentDOMElementTag: 'code',
        });
    },
});
