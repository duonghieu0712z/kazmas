import type { UseUndoRedoConfig } from './useUndoRedo';
import type { ButtonProps } from '@/components/ui/button';

export { default as UndoRedoButton } from './UndoRedoButton.vue';
export * from './useUndoRedo';

export interface UndoRedoButtonProps
    extends Omit<ButtonProps, 'size'>, Omit<UseUndoRedoConfig, 'onExecuted'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
