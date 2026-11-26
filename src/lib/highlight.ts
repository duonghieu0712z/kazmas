import { escapeForRegEx } from '@tiptap/vue-3';

export function getHighlightColorPattern(value: string) {
    const style = document.createElement('span').style;
    style.color = value;

    return new RegExp(`^(${escapeForRegEx(value)}|${escapeForRegEx(style.color)})$`, 'i');
}
