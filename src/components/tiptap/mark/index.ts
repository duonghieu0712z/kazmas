import type { MarkType } from './use-mark.ts';
import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as MarkButton } from './MarkButton.vue';
export * from './use-mark';

export interface MarkButtonProps extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    type: MarkType;
    label?: string;
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
