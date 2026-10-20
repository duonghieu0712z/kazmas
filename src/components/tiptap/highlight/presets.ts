import type { HighlightPresetColors } from '@/lib/highlight';

export interface HighlightPresetValue extends HighlightPresetColors {
    label: string;
}

export const HIGHLIGHT_PRESETS: HighlightPresetValue[] = [
    {
        id: 'yellow',
        label: 'Yellow',
        color: 'var(--color-editor-highlight-yellow-foreground)',
        backgroundColor: 'var(--color-editor-highlight-yellow-background)',
    },
    {
        id: 'green',
        label: 'Green',
        color: 'var(--color-editor-highlight-green-foreground)',
        backgroundColor: 'var(--color-editor-highlight-green-background)',
    },
    {
        id: 'blue',
        label: 'Blue',
        color: 'var(--color-editor-highlight-blue-foreground)',
        backgroundColor: 'var(--color-editor-highlight-blue-background)',
    },
    {
        id: 'purple',
        label: 'Purple',
        color: 'var(--color-editor-highlight-purple-foreground)',
        backgroundColor: 'var(--color-editor-highlight-purple-background)',
    },
    {
        id: 'pink',
        label: 'Pink',
        color: 'var(--color-editor-highlight-pink-foreground)',
        backgroundColor: 'var(--color-editor-highlight-pink-background)',
    },
];
