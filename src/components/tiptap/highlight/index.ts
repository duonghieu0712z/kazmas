import type { HighlightPresetValue } from './presets';
import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as HighlightPopover } from './HighlightPopover.vue';
export { default as HighlightGroup } from './HighlightGroup.vue';
export { default as HighlightPreset } from './HighlightPreset.vue';
export * from './presets';
export * from './use-highlight';

export interface HighlightPresetProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    preset: HighlightPresetValue;
    showTooltip?: boolean;
}

export interface HighlightGroupProps extends ButtonGroupProps, TiptapControlProps {
    presets?: HighlightPresetValue[];
}

export interface HighlightPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    presets?: HighlightPresetValue[];
    showTooltip?: boolean;
}
