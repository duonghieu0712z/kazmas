import type { UseListConfig } from './use-list';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as ListButton } from './ListButton.vue';
export * from './use-list';

export interface ListButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseListConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
