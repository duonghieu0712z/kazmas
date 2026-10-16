import type { JSONContent } from '@tiptap/vue-3';

import { closeHistory } from '@tiptap/pm/history';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, it } from 'vitest';

import { getDocumentTextSize, setDocumentTextSize } from '@/components/tiptap/document-text-size';
import { setFontFamily } from '@/components/tiptap/font-family';
import { getActiveFontSize, setFontSize } from '@/components/tiptap/font-size';
import { HIGHLIGHT_PRESETS, setHighlight } from '@/components/tiptap/highlight';
import { getActiveLineHeight, setLineHeight } from '@/components/tiptap/line-height';
import { resetAllFormatting } from '@/components/tiptap/reset-all-formatting';
import { getActiveTextStyleColor, setTextStyleColor } from '@/components/tiptap/text-style-color';

import { createEditorExtensions } from './options';

describe('editor formatting controls', () => {
    const editors: Editor[] = [];

    const createEditor = (content: string | JSONContent = '<p>Before target after</p>') => {
        const editor = new Editor({ extensions: createEditorExtensions(), content });
        editors.push(editor);
        editor.commands.setTextSelection({ from: 8, to: 14 });
        return editor;
    };

    const targetMarks = (editor: Editor) => {
        const marks: Record<string, Record<string, unknown>> = {};

        editor.state.doc.nodesBetween(8, 14, (node) => {
            if (node.isText) {
                for (const mark of node.marks) {
                    marks[mark.type.name] = { ...mark.attrs };
                }
            }
        });

        return marks;
    };

    afterEach(() => {
        for (const editor of editors.splice(0)) {
            editor.destroy();
        }
    });

    it('formats only the selected text and preserves unrelated marks and typography', () => {
        const editor = createEditor();
        editor.commands.setBold();

        expect(setFontFamily(editor, 'Geist')).toBe(true);
        expect(setFontSize(editor, '20px')).toBe(true);
        expect(setLineHeight(editor, 1.5)).toBe(true);
        expect(setTextStyleColor(editor, 'color', '#123456')).toBe(true);
        expect(setTextStyleColor(editor, 'backgroundColor', '#abcdef')).toBe(true);

        expect(targetMarks(editor)).toMatchObject({
            bold: {},
            textStyle: {
                fontFamily: 'Geist',
                fontSize: '20px',
                lineHeight: '1.5',
                color: '#123456',
                backgroundColor: '#abcdef',
            },
        });
        const paragraph = editor.state.doc.firstChild!;
        expect(paragraph.firstChild?.text).toBe('Before ');
        expect(paragraph.firstChild?.marks).toHaveLength(0);
        expect(paragraph.lastChild?.text).toBe(' after');
        expect(paragraph.lastChild?.marks).toHaveLength(0);
        expect(editor.state.selection.from).toBe(8);
        expect(editor.state.selection.to).toBe(14);
    });

    it.each(['color', 'backgroundColor'] as const)(
        'overrides only the corresponding highlight %s and undoes both updates together',
        (type) => {
            const editor = createEditor();
            const preset = HIGHLIGHT_PRESETS[0]!;
            setHighlight(editor, preset);
            editor.commands.command(({ tr }) => {
                closeHistory(tr);
                return true;
            });
            const before = editor.getJSON();

            expect(setTextStyleColor(editor, type, '#123456')).toBe(true);
            expect(getActiveTextStyleColor(editor, type)).toBe('#123456');
            const highlight = targetMarks(editor).highlight!;

            if (type === 'color') {
                expect(highlight.textColor).toBe('#123456');
                expect(highlight.color).toBe(preset.backgroundColor);
            } else {
                expect(highlight.color).toBe('#123456');
                expect(highlight.textColor).toBe(preset.color);
            }

            const after = editor.getJSON();
            expect(editor.commands.undo()).toBe(true);
            expect(editor.getJSON()).toEqual(before);
            expect(editor.commands.redo()).toBe(true);
            expect(editor.getJSON()).toEqual(after);
        },
    );

    it('clears one color without clearing the other or the font settings', () => {
        const editor = createEditor();
        setHighlight(editor, HIGHLIGHT_PRESETS[0]!);
        setFontFamily(editor, 'Geist');
        setTextStyleColor(editor, 'color', '#123456');
        setTextStyleColor(editor, 'backgroundColor', '#abcdef');

        setTextStyleColor(editor, 'color', null);
        expect(getActiveTextStyleColor(editor, 'color')).toBeNull();
        expect(getActiveTextStyleColor(editor, 'backgroundColor')).toBe('#abcdef');
        expect(targetMarks(editor).textStyle?.fontFamily).toBe('Geist');

        setTextStyleColor(editor, 'color', '#654321');
        setTextStyleColor(editor, 'backgroundColor', null);
        expect(getActiveTextStyleColor(editor, 'backgroundColor')).toBeNull();
        expect(getActiveTextStyleColor(editor, 'color')).toBe('#654321');
    });

    it('updates stored highlight colors at a cursor without recoloring existing text', () => {
        const editor = createEditor();
        setHighlight(editor, HIGHLIGHT_PRESETS[0]!);
        editor.commands.setTextSelection(10);
        const before = editor.getJSON();

        setTextStyleColor(editor, 'color', '#123456');
        expect(editor.getJSON()).toEqual(before);
        expect(getActiveTextStyleColor(editor, 'color')).toBe('#123456');
        editor.commands.insertContent('X');
        expect(editor.view.dom.querySelector('span')?.style.color).toBe('rgb(18, 52, 86)');
        expect(editor.state.doc.textContent).toBe('Before taXrget after');
    });

    it('reports mixed values and returns to inherited defaults after clearing formatting', () => {
        const editor = createEditor();
        expect(getActiveLineHeight(editor)).toBe(1.15);
        setFontSize(editor, '20px');
        setLineHeight(editor, 2);
        setTextStyleColor(editor, 'color', '#123456');
        editor.commands.setTextSelection({ from: 1, to: 14 });

        expect(getActiveFontSize(editor)).toBeUndefined();
        expect(getActiveLineHeight(editor)).toBeUndefined();
        expect(getActiveTextStyleColor(editor, 'color')).toBeUndefined();
        expect(resetAllFormatting(editor)).toBe(true);
        expect(getActiveFontSize(editor)).toBeNull();
        expect(getActiveLineHeight(editor)).toBe(1.15);
        expect(getActiveTextStyleColor(editor, 'color')).toBeNull();
        expect(editor.state.doc.textContent).toBe('Before target after');
    });

    it('round-trips formatting through document JSON and HTML', () => {
        const editor = createEditor();
        setHighlight(editor, HIGHLIGHT_PRESETS[1]!);
        setFontFamily(editor, 'Geist');
        setFontSize(editor, '18px');
        setLineHeight(editor, 1.5);
        setTextStyleColor(editor, 'color', '#123456');
        setTextStyleColor(editor, 'backgroundColor', '#abcdef');

        const json = editor.getJSON();
        const restored = createEditor(JSON.parse(JSON.stringify(json)) as JSONContent);
        expect(restored.getJSON()).toEqual(json);

        const html = createEditor(editor.getHTML());
        expect(targetMarks(html)).toMatchObject({
            highlight: targetMarks(editor).highlight,
            textStyle: {
                fontFamily: 'Geist',
                fontSize: '18px',
                lineHeight: '1.5',
                color: 'rgb(18, 52, 86)',
                backgroundColor: 'rgb(171, 205, 239)',
            },
        });
        expect(html.state.doc.textContent).toBe(editor.state.doc.textContent);
    });

    it('stores document text size separately from explicit selection font sizes', () => {
        const editor = createEditor();
        setFontSize(editor, '20px');
        const before = editor.getJSON();

        editor.commands.command(({ tr }) => {
            closeHistory(tr);
            return true;
        });
        expect(setDocumentTextSize(editor, 1.25)).toBe(true);
        expect(getDocumentTextSize(editor)).toBe(1.25);
        expect(getActiveFontSize(editor)).toBe('20px');
        expect(editor.view.dom.style.fontSize).toBe('1.25rem');
        expect(editor.getJSON().content).toEqual(before.content);

        const restored = createEditor(editor.getJSON());
        expect(getDocumentTextSize(restored)).toBe(1.25);
        expect(restored.view.dom.style.fontSize).toBe('1.25rem');
        expect(editor.commands.undo()).toBe(true);
        expect(editor.getJSON()).toEqual(before);
        expect(editor.commands.redo()).toBe(true);
        expect(getDocumentTextSize(editor)).toBe(1.25);
    });

    it('rejects unsupported, destroyed, read-only, and code editors without changing content', () => {
        const editor = createEditor();
        const before = editor.getJSON();
        expect(setFontSize(editor, '0px')).toBe(false);
        expect(setFontSize(editor, '20em')).toBe(false);
        expect(setLineHeight(editor, -1)).toBe(false);

        editor.setEditable(false);
        expect(setFontFamily(editor, 'Geist')).toBe(false);
        expect(setFontSize(editor, '20px')).toBe(false);
        expect(setLineHeight(editor, 2)).toBe(false);
        expect(setTextStyleColor(editor, 'color', '#123456')).toBe(false);
        expect(setDocumentTextSize(editor, 1.25)).toBe(false);
        expect(editor.getJSON()).toEqual(before);

        const unsupported = new Editor({ extensions: [StarterKit], content: '<p>Text</p>' });
        editors.push(unsupported);
        expect(setTextStyleColor(unsupported, 'color', '#123456')).toBe(false);
        expect(setLineHeight(unsupported, 2)).toBe(false);
        unsupported.destroy();
        expect(setTextStyleColor(unsupported, 'color', '#123456')).toBe(false);

        editor.setEditable(true);
        editor.commands.setCode();
        expect(setTextStyleColor(editor, 'color', '#123456')).toBe(false);
        expect(setFontFamily(editor, 'Geist')).toBe(false);
    });
});
