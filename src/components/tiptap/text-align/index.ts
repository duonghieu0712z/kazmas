import type { UseTextAlignConfig } from './useTextAlign';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as TextAlignButton } from './TextAlignButton.vue';
export * from './useTextAlign';

export interface TextAlignButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseTextAlignConfig, 'onAligned'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
