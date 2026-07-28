import type { UseCodeBlockConfig } from './useCodeBlock';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as CodeBlockButton } from './CodeBlockButton.vue';
export * from './useCodeBlock';

export interface CodeBlockButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseCodeBlockConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
