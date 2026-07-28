import type { UseMarkConfig } from './useMark.ts';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as MarkButton } from './MarkButton.vue';
export * from './useMark';

export interface MarkButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseMarkConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
