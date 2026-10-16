import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as FontFamilyDropdown } from './FontFamilyDropdown.vue';
export { default as FontFamilyList } from './FontFamilyList.vue';
export * from './use-font-family';

export interface FontFamilyDropdownProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    fonts?: string[];
    loading?: boolean;
    error?: boolean;
    showTooltip?: boolean;
}

export interface FontFamilyListProps extends Pick<
    FontFamilyDropdownProps,
    'fonts' | 'loading' | 'error'
> {
    activeFontFamily?: string | null;
    defaultFontFamily: string;
    defaultLabel: string;
}
