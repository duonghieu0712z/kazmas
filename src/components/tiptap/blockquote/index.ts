import type { UseBlockquoteConfig } from './useBlockquote';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as BlockquoteButton } from './BlockquoteButton.vue';
export * from './useBlockquote';

export interface BlockquoteButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseBlockquoteConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
