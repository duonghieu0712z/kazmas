import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, it } from 'vitest';

import { ActiveMark } from './active-mark';

describe('active mark decoration', () => {
    let editor: Editor;
    afterEach(() => editor.destroy());

    it('decorates only the selected mark range and clears decorations outside it', () => {
        editor = new Editor({
            extensions: [
                StarterKit,
                ActiveMark.configure({
                    types: ['link'],
                    HTMLAttributes: { class: 'selected-link' },
                }),
            ],
            content: '<p><a href="https://example.com">link</a> plain</p>',
        });
        editor.commands.setTextSelection(2);
        expect(editor.view.dom.querySelector('.selected-link')?.textContent).toBe('link');
        editor.commands.setTextSelection(8);
        expect(editor.view.dom.querySelector('.selected-link')).toBeNull();
    });

    it('ignores missing mark types without changing document content', () => {
        editor = new Editor({
            extensions: [StarterKit, ActiveMark.configure({ types: ['missing'] })],
            content: '<p>Text</p>',
        });
        editor.commands.setTextSelection(2);
        expect(editor.getJSON()).toEqual({
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Text' }] }],
        });
    });
});
