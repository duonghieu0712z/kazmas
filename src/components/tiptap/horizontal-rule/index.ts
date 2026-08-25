import type { UseHorizontalRuleConfig } from './use-horizontal-rule';
import type { ButtonProps } from '@/components/ui/button';

export { default as HorizontalRuleButton } from './HorizontalRuleButton.vue';
export * from './use-horizontal-rule';

export interface HorizontalRuleButtonProps
    extends Omit<ButtonProps, 'size'>, Omit<UseHorizontalRuleConfig, 'onInserted'> {
    showLabel?: boolean;
    showTooltip?: boolean;
}
