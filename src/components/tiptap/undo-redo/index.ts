import type { UseUndoRedoConfig } from './use-undo-redo';
import type { ButtonProps } from '@/components/ui/button';

export { default as UndoRedoButton } from './UndoRedoButton.vue';
export * from './use-undo-redo';

export interface UndoRedoButtonProps
    extends Omit<ButtonProps, 'size'>, Omit<UseUndoRedoConfig, 'onExecuted'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
