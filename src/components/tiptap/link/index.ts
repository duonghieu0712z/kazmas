import type { UseLinkConfig } from './use-link';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as LinkPopover } from './LinkPopover.vue';
export * from './use-link';

export interface LinkPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, Omit<UseLinkConfig, 'onSetLink'> {
    showTooltip?: boolean;
}
