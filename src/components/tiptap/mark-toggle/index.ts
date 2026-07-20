import type { UseMarkConfig } from './useMark.ts';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as MarkToggle } from './MarkToggle.vue';
export * from './useMark';

export interface MarkToggleProps
    extends Omit<ToggleProps, 'size'>, Omit<UseMarkConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
