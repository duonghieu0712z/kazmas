import type { UseListConfig } from './useList';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as ListButton } from './ListButton.vue';
export * from './useList';

export interface ListButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseListConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
