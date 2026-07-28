import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { TextQuoteIcon } from '@lucide/vue';
import { isNodeSelection } from '@tiptap/vue-3';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeInSchema, isNodeTypeSelected, parseShortcutKeys } from '@/lib/tiptap';

export interface UseBlockquoteConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    onToggled?: () => void;
}

export const BLOCKQUOTE_LABEL = 'Blockquote';
export const BLOCKQUOTE_SHORTCUT_KEY = 'mod+shift+b';

export function canToggleBlockquote(editor: Editor | null) {
    if (
        !editor?.isEditable ||
        !isNodeInSchema(editor, 'blockquote') ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    return editor.can().toggleWrap('blockquote');
}

export function isBlockquoteActive(editor: Editor | null) {
    if (!editor?.isEditable) {
        return false;
    }

    return editor.isActive('blockquote');
}

export function toggleBlockquote(editor: Editor | null) {
    if (!editor?.isEditable || !canToggleBlockquote(editor)) {
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

        const toggle = editor.isActive('blockquote')
            ? chain.lift('blockquote')
            : chain.wrapIn('blockquote');

        return toggle.run();
    } catch {
        return false;
    }
}

export function shouldShowBlockquoteButton(editor: Editor | null, hideWhenUnavailable: boolean) {
    if (!editor?.isEditable || !isNodeInSchema(editor, 'blockquote')) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canToggleBlockquote(editor);
    }

    return true;
}

export function useBlockquote(config: UseBlockquoteConfig) {
    const editor = useTiptapEditor(config.editor);

    const canToggle = computed(() => canToggleBlockquote(editor.value));
    const isActive = computed(() => isBlockquoteActive(editor.value));
    const isVisible = computed(() =>
        shouldShowBlockquoteButton(editor.value, config.hideWhenUnavailable ?? false),
    );

    const handleBlockquote = () => {
        const success = toggleBlockquote(editor.value);
        if (success) {
            config.onToggled?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canToggle,
        label: BLOCKQUOTE_LABEL,
        icon: TextQuoteIcon,
        shortcutKeys: parseShortcutKeys(BLOCKQUOTE_SHORTCUT_KEY),
        handleBlockquote,
    };
}
