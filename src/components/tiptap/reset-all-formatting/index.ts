import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ButtonProps } from '@/components/ui/button';

export { default as ResetAllFormattingButton } from './ResetAllFormattingButton.vue';
export * from './use-reset-all-formatting';

export interface ResetAllFormattingButtonProps
    extends Omit<ButtonProps, 'size'>, TiptapControlProps {
    preserveMarks?: string[];
    showLabel?: boolean;
    showTooltip?: boolean;
}
