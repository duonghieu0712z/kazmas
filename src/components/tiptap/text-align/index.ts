import type { TextAlign } from './use-text-align';
import type { TiptapControlProps, TiptapEditorProps } from '@/components/tiptap/editor';
import type { ButtonGroupProps } from '@/components/ui/button-group';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as TextAlignButton } from './TextAlignButton.vue';
export { default as TextAlignGroup } from './TextAlignGroup.vue';
export { default as TextAlignPopover } from './TextAlignPopover.vue';
export * from './use-text-align';
export * from './use-text-aligns';

export interface TextAlignButtonProps extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    align: TextAlign;
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface TextAlignGroupProps extends ButtonGroupProps, TiptapEditorProps {
    aligns?: TextAlign[];
}

export interface TextAlignPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    aligns?: TextAlign[];
    orientation?: ButtonGroupProps['orientation'];
    showTooltip?: boolean;
}
