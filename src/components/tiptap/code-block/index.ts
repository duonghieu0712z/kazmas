import type { UseCodeBlockConfig } from './use-code-block';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as CodeBlockButton } from './CodeBlockButton.vue';
export * from './use-code-block';

export interface CodeBlockButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseCodeBlockConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
