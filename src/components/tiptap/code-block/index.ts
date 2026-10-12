import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as CodeBlockButton } from './CodeBlockButton.vue';
export * from './use-code-block';

export interface CodeBlockButtonProps extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
