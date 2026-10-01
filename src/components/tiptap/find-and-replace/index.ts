import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';
import type { HTMLAttributes } from 'vue';

export { default as FindAndReplaceButton } from './FindAndReplaceButton.vue';
export { default as FindAndReplacePanel } from './FindAndReplacePanel.vue';
export * from './use-find-and-replace';

export interface FindAndReplaceButtonProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    open?: boolean;
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface FindAndReplacePanelProps extends TiptapControlProps {
    open?: boolean;
    enableShortcut?: boolean;
    autoFocusSearch?: boolean;
    scrollIntoViewOptions?: ScrollIntoViewOptions;
    class?: HTMLAttributes['class'];
}
