import type { CanCommands, ChainedCommands, Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from '@lucide/vue';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeTypeSelected, parseShortcutKeys } from '@/lib/tiptap';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface UseTextAlignConfig {
    editor?: MaybeRefOrGetter<Editor>;
    align: TextAlign;
    hideWhenUnavailable?: boolean;
    onAligned?: () => void;
}

export const TEXT_ALIGN_ICONS = {
    left: AlignLeftIcon,
    center: AlignCenterIcon,
    right: AlignRightIcon,
    justify: AlignJustifyIcon,
} satisfies Record<TextAlign, Component>;

export const TEXT_ALIGN_LABELS = {
    left: 'Align left',
    center: 'Align center',
    right: 'Align right',
    justify: 'Align justify',
} satisfies Record<TextAlign, string>;

export const TEXT_ALIGN_SHORTCUT_KEYS = {
    left: 'mod+shift+l',
    center: 'mod+shift+e',
    right: 'mod+shift+r',
    justify: 'mod+shift+j',
} satisfies Record<TextAlign, string>;

export function hasSetTextAlign(commands: CanCommands): commands is CanCommands & {
    setTextAlign: (align: TextAlign) => boolean;
};
export function hasSetTextAlign(commands: ChainedCommands): commands is ChainedCommands & {
    setTextAlign: (align: TextAlign) => ChainedCommands;
};
export function hasSetTextAlign(commands: CanCommands | ChainedCommands) {
    return 'setTextAlign' in commands;
}

export function isTextAlignAvailable(editor: Editor | null) {
    return (
        editor?.extensionManager.extensions.some((extension) => extension.name === 'textAlign') ??
        false
    );
}

export function canSetTextAlign(editor: Editor | null, align: TextAlign) {
    if (
        !editor?.isEditable ||
        !isTextAlignAvailable(editor) ||
        isNodeTypeSelected(editor, ['image', 'horizontalRule'])
    ) {
        return false;
    }

    const commands = editor.can();
    if (!hasSetTextAlign(commands)) {
        return false;
    }

    return commands.setTextAlign(align);
}

export function isTextAlignActive(editor: Editor | null, align: TextAlign) {
    if (!editor?.isEditable) {
        return false;
    }

    return editor.isActive({ textAlign: align });
}

export function setTextAlign(editor: Editor | null, align: TextAlign) {
    if (!editor?.isEditable || !canSetTextAlign(editor, align)) {
        return false;
    }

    const chain = editor.chain().focus();
    if (hasSetTextAlign(chain)) {
        return chain.setTextAlign(align).run();
    }

    return false;
}

export function shouldShowTextAlignButton(
    editor: Editor | null,
    align: TextAlign,
    hideWhenUnavailable: boolean,
) {
    if (!editor?.isEditable || !isTextAlignAvailable(editor)) {
        return false;
    }

    if (hideWhenUnavailable && !editor.isActive('code')) {
        return canSetTextAlign(editor, align);
    }

    return true;
}

export function useTextAlign(config: UseTextAlignConfig) {
    const editor = useTiptapEditor(config.editor);

    const canAlign = computed(() => canSetTextAlign(editor.value, config.align));
    const isActive = computed(() => isTextAlignActive(editor.value, config.align));
    const isVisible = computed(() =>
        shouldShowTextAlignButton(editor.value, config.align, config.hideWhenUnavailable ?? false),
    );

    const handleTextAlign = () => {
        const success = setTextAlign(editor.value, config.align);
        if (success) {
            config.onAligned?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canAlign,
        label: TEXT_ALIGN_LABELS[config.align],
        icon: TEXT_ALIGN_ICONS[config.align],
        shortcutKeys: parseShortcutKeys(TEXT_ALIGN_SHORTCUT_KEYS[config.align]),
        handleTextAlign,
    };
}
