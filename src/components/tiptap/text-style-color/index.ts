import type { TextStyleColorPresetValue, TextStyleColorType } from './presets';
import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as TextStyleColorPopover } from './TextStyleColorPopover.vue';
export * from './presets';
export * from './use-text-style-color';

export interface TextStyleColorPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    type: TextStyleColorType;
    presets?: TextStyleColorPresetValue[];
    showTooltip?: boolean;
}
