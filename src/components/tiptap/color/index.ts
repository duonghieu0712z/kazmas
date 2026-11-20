import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as TextColorGroup } from './TextColorGroup.vue';
export { default as TextColorPopover } from './TextColorPopover.vue';
export { default as TextColorPreset } from './TextColorPreset.vue';
export { HIGHLIGHT_PRESETS } from './presets';
export { getActiveColor, setColor } from './use-text-color';

export type TextColorType = 'highlight' | 'color' | 'backgroundColor';

export interface TextColorPresetValue {
    id: string;
    label: string;
    color: string;
    textColor?: string;
}

export interface TextColorPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    type: TextColorType;
    presets?: TextColorPresetValue[];
    showTooltip?: boolean;
}

export interface TextColorGroupProps extends ButtonGroupProps {
    presets: TextColorPresetValue[];
    activePreset?: TextColorPresetValue;
    disabled?: boolean;
    showTooltip?: boolean;
}

export interface TextColorPresetProps extends Omit<ToggleProps, 'modelValue' | 'size'> {
    preset: TextColorPresetValue;
    active?: boolean;
    showTooltip?: boolean;
}
