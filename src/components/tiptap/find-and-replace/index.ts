import type { UseFindAndReplaceConfig } from './use-find-and-replace';
import type { ToggleProps } from '@/components/ui/toggle';
import type { HTMLAttributes } from 'vue';

export { default as FindAndReplaceButton } from './FindAndReplaceButton.vue';
export { default as FindAndReplacePanel } from './FindAndReplacePanel.vue';
export * from './use-find-and-replace';

export interface FindAndReplaceButtonProps
    extends
        Omit<ToggleProps, 'modelValue' | 'size'>,
        Pick<UseFindAndReplaceConfig, 'editor' | 'hideWhenUnavailable'> {
    open?: boolean;
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}

export interface FindAndReplacePanelProps extends UseFindAndReplaceConfig {
    open?: boolean;
    enableShortcut?: boolean;
    autoFocusSearch?: boolean;
    class?: HTMLAttributes['class'];
}
