import type { UseTextAlignConfig } from './use-text-align';
import type { UseTextAlignsConfig } from './use-text-aligns';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as TextAlignButton } from './TextAlignButton.vue';
export { default as TextAlignGroup } from './TextAlignGroup.vue';
export { default as TextAlignPopover } from './TextAlignPopover.vue';
export * from './use-text-align';
export * from './use-text-aligns';

export interface TextAlignButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseTextAlignConfig, 'onAligned'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface TextAlignGroupProps
    extends ButtonGroupProps, Pick<UseTextAlignsConfig, 'editor' | 'aligns'> {}

export interface TextAlignPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, UseTextAlignsConfig {
    orientation?: ButtonGroupProps['orientation'];
    showTooltip?: boolean;
}
