import type { ListType } from './use-list';
import type { TiptapControlProps, TiptapEditorProps } from '@/components/tiptap/editor';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as ListButton } from './ListButton.vue';
export { default as ListDropdown } from './ListDropdown.vue';
export { default as ListGroup } from './ListGroup.vue';
export { default as ListPopover } from './ListPopover.vue';
export * from './use-list';
export * from './use-lists';

export interface ListButtonProps extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    type: ListType;
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface ListDropdownProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    types?: ListType[];
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface ListGroupProps extends ButtonGroupProps, TiptapEditorProps {
    types?: ListType[];
}

export interface ListPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    types?: ListType[];
    orientation?: ButtonGroupProps['orientation'];
    showTooltip?: boolean;
}
