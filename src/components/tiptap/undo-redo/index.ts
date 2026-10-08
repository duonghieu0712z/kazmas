import type { UndoRedoAction } from './use-undo-redo';
import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ButtonProps } from '@/components/ui/button';

export { default as UndoRedoButton } from './UndoRedoButton.vue';
export * from './use-undo-redo';

export interface UndoRedoButtonProps extends Omit<ButtonProps, 'size'>, TiptapControlProps {
    action: UndoRedoAction;
    label?: string;
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
