import type { UseTextAlignConfig } from './useTextAlign';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as TextAlignToggle } from './TextAlignToggle.vue';
export * from './useTextAlign';

export interface TextAlignToggleProps
    extends Omit<ToggleProps, 'size'>, Omit<UseTextAlignConfig, 'onAligned'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
