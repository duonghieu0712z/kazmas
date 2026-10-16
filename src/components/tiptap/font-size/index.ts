import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as FontSizeDropdown } from './FontSizeDropdown.vue';
export { default as FontSizeList } from './FontSizeList.vue';
export * from './use-font-size';

export interface FontSizeDropdownProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    sizes?: number[];
    showTooltip?: boolean;
}

export interface FontSizeListProps {
    sizes: number[];
    activeFontSize?: string | null;
    defaultLabel: string;
}
