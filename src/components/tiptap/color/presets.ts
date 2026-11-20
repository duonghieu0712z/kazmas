import type { TextColorPresetValue } from '.';

export const HIGHLIGHT_PRESETS: TextColorPresetValue[] = [
    {
        id: 'yellow',
        label: 'Yellow',
        color: 'var(--color-editor-highlight-yellow-background)',
        textColor: 'var(--color-editor-highlight-yellow-foreground)',
    },
    {
        id: 'green',
        label: 'Green',
        color: 'var(--color-editor-highlight-green-background)',
        textColor: 'var(--color-editor-highlight-green-foreground)',
    },
    {
        id: 'blue',
        label: 'Blue',
        color: 'var(--color-editor-highlight-blue-background)',
        textColor: 'var(--color-editor-highlight-blue-foreground)',
    },
    {
        id: 'purple',
        label: 'Purple',
        color: 'var(--color-editor-highlight-purple-background)',
        textColor: 'var(--color-editor-highlight-purple-foreground)',
    },
    {
        id: 'pink',
        label: 'Pink',
        color: 'var(--color-editor-highlight-pink-background)',
        textColor: 'var(--color-editor-highlight-pink-foreground)',
    },
];

export const TEXT_COLOR_PRESETS: TextColorPresetValue[] = [
    { id: 'yellow', label: 'Yellow', color: 'var(--color-editor-text-yellow)' },
    { id: 'green', label: 'Green', color: 'var(--color-editor-text-green)' },
    { id: 'blue', label: 'Blue', color: 'var(--color-editor-text-blue)' },
    { id: 'purple', label: 'Purple', color: 'var(--color-editor-text-purple)' },
    { id: 'pink', label: 'Pink', color: 'var(--color-editor-text-pink)' },
];

export const TEXT_BACKGROUND_COLOR_PRESETS: TextColorPresetValue[] = [
    { id: 'yellow', label: 'Yellow', color: 'var(--color-editor-text-background-yellow)' },
    { id: 'green', label: 'Green', color: 'var(--color-editor-text-background-green)' },
    { id: 'blue', label: 'Blue', color: 'var(--color-editor-text-background-blue)' },
    { id: 'purple', label: 'Purple', color: 'var(--color-editor-text-background-purple)' },
    { id: 'pink', label: 'Pink', color: 'var(--color-editor-text-background-pink)' },
];
