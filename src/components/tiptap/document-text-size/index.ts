import type { DocumentTextSizePresetValue } from './presets';
import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as DocumentTextSizePopover } from './DocumentTextSizePopover.vue';
export { default as DocumentTextSizeGroup } from './DocumentTextSizeGroup.vue';
export { default as DocumentTextSizePreset } from './DocumentTextSizePreset.vue';
export * from './presets';
export * from './use-document-text-size';

export interface DocumentTextSizePresetProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    preset: DocumentTextSizePresetValue;
    showTooltip?: boolean;
}

export interface DocumentTextSizeGroupProps extends ButtonGroupProps, TiptapControlProps {
    presetCount?: 3 | 5;
}

export interface DocumentTextSizePopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    orientation?: ButtonGroupProps['orientation'];
    presetCount?: DocumentTextSizeGroupProps['presetCount'];
    showTooltip?: boolean;
}
