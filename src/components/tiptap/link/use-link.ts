import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { LinkIcon } from '@lucide/vue';
import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { computed, ref, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isMarkInSchema, isNodeTypeSelected, sanitizeUrl } from '@/lib/tiptap';

export interface UseLinkConfig {
    editor?: MaybeRefOrGetter<Editor>;
    hideWhenUnavailable?: boolean;
    onSetLink?: () => void;
}

export const LINK_LABEL = 'Link';

export function canSetLink(editor: Editor | null) {
    if (
        !editor?.isEditable ||
        !isMarkInSchema(editor, 'link') ||
        isNodeTypeSelected(editor, ['image'])
    ) {
        return false;
    }

    return editor.can().setMark('link');
}

export function isLinkActive(editor: Editor | null) {
    if (!editor?.isEditable || !isMarkInSchema(editor, 'link')) {
        return false;
    }

    return editor.isActive('link');
}

export function shouldShowLinkButton(editor: Editor | null, hideWhenUnavailable: boolean) {
    if (!editor?.isEditable || !isMarkInSchema(editor, 'link')) {
        return false;
    }

    return !hideWhenUnavailable || canSetLink(editor);
}

export function setLink(editor: Editor | null, url: string) {
    const href = url.trim();
    if (!editor || !href || !canSetLink(editor)) {
        return false;
    }

    const shouldInsertText = editor.state.selection.empty && !editor.isActive('link');
    let chain = editor.chain().focus().extendMarkRange('link').setLink({ href });
    if (shouldInsertText) {
        chain = chain.insertContent({ type: 'text', text: href });
    }

    return chain.run();
}

export function removeLink(editor: Editor | null) {
    if (!editor || !isLinkActive(editor)) {
        return false;
    }

    return editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .unsetLink()
        .setMeta('preventAutolink', true)
        .run();
}

export async function openLink(url: string) {
    const safeUrl = sanitizeUrl(url, window.location.href);
    if (safeUrl === '#') {
        return false;
    }

    try {
        if (isTauri()) {
            await openUrl(safeUrl);
        } else {
            window.open(safeUrl, '_blank', 'noopener,noreferrer');
        }
        return true;
    } catch {
        return false;
    }
}

export function useLink(config: UseLinkConfig = {}) {
    const editor = useTiptapEditor(config.editor);
    const url = ref('');

    const canSet = computed(() => canSetLink(editor.value));
    const isActive = computed(() => isLinkActive(editor.value));
    const isVisible = computed(() =>
        shouldShowLinkButton(editor.value, config.hideWhenUnavailable ?? false),
    );

    watch(
        editor,
        (currentEditor, _previousEditor, onCleanup) => {
            if (!currentEditor) {
                url.value = '';
                return;
            }

            function updateLinkState() {
                const href = currentEditor?.getAttributes('link').href;
                url.value = typeof href === 'string' ? href : '';
            }

            updateLinkState();
            currentEditor.on('selectionUpdate', updateLinkState);
            currentEditor.on('update', updateLinkState);
            onCleanup(() => {
                currentEditor.off('selectionUpdate', updateLinkState);
                currentEditor.off('update', updateLinkState);
            });
        },
        { immediate: true },
    );

    const handleSetLink = () => {
        const href = url.value.trim();
        const success = setLink(editor.value, href);
        if (success) {
            url.value = href;
            config.onSetLink?.();
        }
        return success;
    };

    const handleRemoveLink = () => {
        const success = removeLink(editor.value);
        if (success) {
            url.value = '';
        }
        return success;
    };

    const handleOpenLink = () => openLink(url.value);

    return {
        url,
        canSet,
        isActive,
        isVisible,
        label: LINK_LABEL,
        icon: LinkIcon,
        handleSetLink,
        handleRemoveLink,
        handleOpenLink,
    };
}
