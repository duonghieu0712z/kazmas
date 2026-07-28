import type { UseHeadingConfig } from './useHeading';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as HeadingButton } from './HeadingButton.vue';
export * from './useHeading';

export interface HeadingButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseHeadingConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
