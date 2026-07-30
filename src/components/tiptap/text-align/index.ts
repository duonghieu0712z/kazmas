import type { UseTextAlignConfig } from './use-text-align';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as TextAlignButton } from './TextAlignButton.vue';
export * from './use-text-align';

export interface TextAlignButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseTextAlignConfig, 'onAligned'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
