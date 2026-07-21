import type { UseHeadingConfig } from './useHeading';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as HeadingToggle } from './HeadingToggle.vue';
export * from './useHeading';

export interface HeadingToggleProps
    extends Omit<ToggleProps, 'size'>, Omit<UseHeadingConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
