import type { DocumentTextSizeValue } from '@/extensions/tiptap';

export interface DocumentTextSizePresetValue {
    label: string;
    value: DocumentTextSizeValue;
    textClass: string;
}

export const DOCUMENT_TEXT_SIZE_PRESETS: DocumentTextSizePresetValue[] = [
    { label: 'Extra small', value: 0.75, textClass: 'text-xs' },
    { label: 'Small', value: 0.875, textClass: 'text-sm' },
    { label: 'Default', value: 1, textClass: 'text-base' },
    { label: 'Large', value: 1.125, textClass: 'text-lg' },
    { label: 'Extra large', value: 1.25, textClass: 'text-xl' },
];
