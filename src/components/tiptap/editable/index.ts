import type { TiptapEditorProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as EditableButton } from './EditableButton.vue';
export * from './use-editable';

export interface EditableButtonProps extends Omit<ToggleProps, 'size'>, TiptapEditorProps {
    showLabel?: boolean;
    showTooltip?: boolean;
}
