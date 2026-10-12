import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ButtonProps } from '@/components/ui/button';

export { default as HorizontalRuleButton } from './HorizontalRuleButton.vue';
export * from './use-horizontal-rule';

export interface HorizontalRuleButtonProps extends Omit<ButtonProps, 'size'>, TiptapControlProps {
    showLabel?: boolean;
    showTooltip?: boolean;
}
