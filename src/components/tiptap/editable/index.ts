import type { UseEditableConfig } from './use-editable';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as EditableButton } from './EditableButton.vue';
export * from './use-editable';

export interface EditableButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseEditableConfig, 'onChanged'> {
    showLabel?: boolean;
    showTooltip?: boolean;
}
