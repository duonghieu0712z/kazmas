import type { UseListConfig } from './use-list';
import type { UseListsConfig } from './use-lists';
import type { ButtonProps } from '@/components/ui/button';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as ListButton } from './ListButton.vue';
export { default as ListDropdown } from './ListDropdown.vue';
export { default as ListGroup } from './ListGroup.vue';
export { default as ListPopover } from './ListPopover.vue';
export * from './use-list';
export * from './use-lists';

export interface ListButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseListConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface ListDropdownProps
    extends Omit<ButtonProps, 'size'>, Omit<UseListsConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface ListGroupProps
    extends ButtonGroupProps, Pick<UseListsConfig, 'editor' | 'types'> {}

export interface ListPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, Omit<UseListsConfig, 'onToggled'> {
    orientation?: ButtonGroupProps['orientation'];
    showTooltip?: boolean;
}
