import type { LineHeightPresetValue } from './presets';
import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as LineHeightPopover } from './LineHeightPopover.vue';
export { default as LineHeightGroup } from './LineHeightGroup.vue';
export { default as LineHeightPreset } from './LineHeightPreset.vue';
export * from './presets';
export * from './use-line-height';

export interface LineHeightPresetProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    preset: LineHeightPresetValue;
    showTooltip?: boolean;
}

export interface LineHeightGroupProps extends ButtonGroupProps, TiptapControlProps {}

export interface LineHeightPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    orientation?: ButtonGroupProps['orientation'];
    showTooltip?: boolean;
}
