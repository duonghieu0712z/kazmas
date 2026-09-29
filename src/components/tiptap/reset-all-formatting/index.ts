import type { UseResetAllFormattingConfig } from './use-reset-all-formatting';
import type { ButtonProps } from '@/components/ui/button';

export { default as ResetAllFormattingButton } from './ResetAllFormattingButton.vue';
export * from './use-reset-all-formatting';

export interface ResetAllFormattingButtonProps
    extends Omit<ButtonProps, 'size'>, Omit<UseResetAllFormattingConfig, 'onReset'> {
    showLabel?: boolean;
    showTooltip?: boolean;
}
