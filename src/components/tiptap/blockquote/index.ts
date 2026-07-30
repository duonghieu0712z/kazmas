import type { UseBlockquoteConfig } from './use-blockquote';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as BlockquoteButton } from './BlockquoteButton.vue';
export * from './use-blockquote';

export interface BlockquoteButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseBlockquoteConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
