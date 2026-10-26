import { escapeForRegEx } from '@tiptap/vue-3';

export interface HighlightPresetColors {
    id: string;
    color: string;
    backgroundColor: string;
}

export function getHighlightColorPattern(value: string) {
    const style = document.createElement('span').style;
    style.color = value;

    return new RegExp(`^(${escapeForRegEx(value)}|${escapeForRegEx(style.color)})$`, 'i');
}

export function getHighlightPresetStyle(preset: HighlightPresetColors) {
    return {
        color: preset.color,
        backgroundColor: preset.backgroundColor,
    };
}
