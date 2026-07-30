import type { UseHeadingConfig } from './use-heading';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as HeadingButton } from './HeadingButton.vue';
export * from './use-heading';

export interface HeadingButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseHeadingConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
