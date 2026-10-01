import type { HeadingLevel, HeadingNodeLevel } from './use-heading';
import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as HeadingButton } from './HeadingButton.vue';
export { default as HeadingDropdown } from './HeadingDropdown.vue';
export * from './use-heading';
export * from './use-headings';

export interface HeadingButtonProps extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    level: HeadingNodeLevel;
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface HeadingDropdownProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    levels?: Exclude<HeadingLevel, 0>[];
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
