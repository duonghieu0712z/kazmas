import type { HeadingLevel, UseHeadingConfig } from './use-heading';
import type { UseHeadingDropdownConfig } from './use-heading-dropdown';
import type { ButtonProps } from '@/components/ui/button';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as HeadingButton } from './HeadingButton.vue';
export { default as HeadingDropdown } from './HeadingDropdown.vue';
export * from './use-heading-dropdown';
export * from './use-heading';

export interface HeadingButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseHeadingConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface HeadingDropdownProps
    extends Omit<ButtonProps, 'size'>, Omit<UseHeadingDropdownConfig, 'onChanged'> {
    levels?: Exclude<HeadingLevel, 0>[];
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
