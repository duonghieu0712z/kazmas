import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { SquareCodeIcon } from '@lucide/vue';
import { isNodeSelection } from '@tiptap/vue-3';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeInSchema, isNodeTypeSelected, parseShortcutKeys } from '@/lib/tiptap';

export interface UseCodeBlockConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    onToggled?: () => void;
}

export const CODE_BLOCK_LABEL = 'Code block';
export const CODE_BLOCK_SHORTCUT_KEY = 'mod+alt+c';

export function canToggleCodeBlock(editor: Editor | null) {
    if (
        !editor?.isEditable ||
        !isNodeInSchema(editor, 'codeBlock') ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    return editor.can().toggleNode('codeBlock', 'paragraph');
}

export function isCodeBlockActive(editor: Editor | null) {
    if (!editor?.isEditable) {
        return false;
    }

    return editor.isActive('codeBlock');
}

export function toggleCodeBlock(editor: Editor | null) {
    if (!editor?.isEditable || !canToggleCodeBlock(editor)) {
        return false;
    }

    try {
        const { selection } = editor.view.state;
        let chain = editor.chain().focus();

        if (isNodeSelection(selection)) {
            const firstChild = selection.node.firstChild?.firstChild;
            const lastChild = selection.node.lastChild?.lastChild;
            const from = firstChild ? selection.from + firstChild.nodeSize : selection.from + 1;
            const to = lastChild ? selection.to - lastChild.nodeSize : selection.to - 1;

            chain = chain.setTextSelection({ from, to }).clearNodes();
        }

        const toggle = editor.isActive('codeBlock')
            ? chain.setNode('paragraph')
            : chain.toggleNode('codeBlock', 'paragraph');

        return toggle.run();
    } catch {
        return false;
    }
}

export function shouldShowCodeBlockButton(editor: Editor | null, hideWhenUnavailable: boolean) {
    if (!editor?.isEditable || !isNodeInSchema(editor, 'codeBlock')) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canToggleCodeBlock(editor);
    }

    return true;
}

export function useCodeBlock(config: UseCodeBlockConfig) {
    const editor = useTiptapEditor(config.editor);

    const canToggle = computed(() => canToggleCodeBlock(editor.value));
    const isActive = computed(() => isCodeBlockActive(editor.value));
    const isVisible = computed(() =>
        shouldShowCodeBlockButton(editor.value, config.hideWhenUnavailable ?? false),
    );

    const handleCodeBlock = () => {
        const success = toggleCodeBlock(editor.value);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label: CODE_BLOCK_LABEL,
        icon: SquareCodeIcon,
        shortcutKeys: parseShortcutKeys(CODE_BLOCK_SHORTCUT_KEY),
        handleCodeBlock,
    };
}
