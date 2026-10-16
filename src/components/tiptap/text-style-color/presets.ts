export type TextStyleColorType = 'color' | 'backgroundColor';

export interface TextStyleColorPresetValue {
    label: string;
    color: string;
}

export const TEXT_COLOR_PRESETS: TextStyleColorPresetValue[] = [
    { label: 'Yellow', color: 'var(--color-editor-text-yellow)' },
    { label: 'Green', color: 'var(--color-editor-text-green)' },
    { label: 'Blue', color: 'var(--color-editor-text-blue)' },
    { label: 'Purple', color: 'var(--color-editor-text-purple)' },
    { label: 'Pink', color: 'var(--color-editor-text-pink)' },
];

export const TEXT_BACKGROUND_COLOR_PRESETS: TextStyleColorPresetValue[] = [
    { label: 'Yellow', color: 'var(--color-editor-text-background-yellow)' },
    { label: 'Green', color: 'var(--color-editor-text-background-green)' },
    { label: 'Blue', color: 'var(--color-editor-text-background-blue)' },
    { label: 'Purple', color: 'var(--color-editor-text-background-purple)' },
    { label: 'Pink', color: 'var(--color-editor-text-background-pink)' },
];
