import type { EditorState } from '@tiptap/pm/state';

import { Decoration, Extension, getMarkRange, isMarkActive } from '@tiptap/vue-3';

export interface ActiveMarkOptions {
    HTMLAttributes: Record<string, string>;
    types: string[];
}

function createActiveMarkDecorations(
    state: EditorState,
    types: string[],
    HTMLAttributes: Record<string, string>,
) {
    const decorations: Decoration[] = [];
    const ranges = new Set<string>();

    for (const name of types) {
        const type = state.schema.marks[name];
        if (!type || !isMarkActive(state, type)) {
            continue;
        }

        const range = getMarkRange(state.selection.$from, type);
        if (!range || range.from > state.selection.from || range.to < state.selection.to) {
            continue;
        }

        const key = `${range.from}:${range.to}`;
        if (ranges.has(key)) {
            continue;
        }

        ranges.add(key);
        decorations.push(Decoration.Inline(range.from, range.to, HTMLAttributes));
    }

    return decorations;
}

export const ActiveMark = Extension.create<ActiveMarkOptions>({
    name: 'activeMark',

    addOptions() {
        return {
            HTMLAttributes: {},
            types: [],
        };
    },

    addDecorations() {
        return {
            create: ({ state }) =>
                createActiveMarkDecorations(state, this.options.types, this.options.HTMLAttributes),
            shouldUpdate: ({ tr, oldState, newState }) =>
                tr.docChanged || !oldState.selection.eq(newState.selection),
        };
    },
});
