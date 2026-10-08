import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as BlockquoteButton } from './BlockquoteButton.vue';
export * from './use-blockquote';

export interface BlockquoteButtonProps extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
