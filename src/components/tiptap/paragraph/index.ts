import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as ParagraphButton } from './ParagraphButton.vue';
export * from './use-paragraph';

export interface ParagraphButtonProps extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
