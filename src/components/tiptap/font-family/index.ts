import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as FontFamilyCombobox } from './FontFamilyCombobox.vue';
export { default as FontFamilyList } from './FontFamilyList.vue';
export * from './use-font-family';

export interface FontFamilyComboboxProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    fonts?: string[];
    loading?: boolean;
    error?: boolean;
    showTooltip?: boolean;
}

export interface FontFamilyListProps extends Pick<
    FontFamilyComboboxProps,
    'fonts' | 'loading' | 'error'
> {
    activeFontFamily?: string | null;
    defaultFontFamily: string;
    defaultLabel: string;
}
