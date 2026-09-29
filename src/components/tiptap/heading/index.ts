import type { HeadingLevel, UseHeadingConfig } from './use-heading';
import type { UseHeadingsConfig } from './use-headings';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as HeadingButton } from './HeadingButton.vue';
export { default as HeadingDropdown } from './HeadingDropdown.vue';
export * from './use-heading';
export * from './use-headings';

export interface HeadingButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseHeadingConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface HeadingDropdownProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, Omit<UseHeadingsConfig, 'onChanged'> {
    levels?: Exclude<HeadingLevel, 0>[];
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
