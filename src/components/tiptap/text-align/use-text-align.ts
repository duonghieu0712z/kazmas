import type { CanCommands, ChainedCommands, Editor } from '@tiptap/vue-3';
import type { Component, MaybeRefOrGetter } from 'vue';

import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from '@lucide/vue';
import { computed, toValue } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { isNodeTypeSelected } from '@/lib/tiptap';
import { getShortcutKeys } from '@/utils/shortcut';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface UseTextAlignConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    align: MaybeRefOrGetter<TextAlign>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
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
    if (!editor) {
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
    editable = editor?.isEditable ?? false,
) {
    if (!editor || !isTextAlignAvailable(editor)) {
        return false;
    }

    if (hideWhenUnavailable && editable && !editor.isActive('code')) {
        return canSetTextAlign(editor, align);
    }

    return true;
}

export function useTextAlign(config: UseTextAlignConfig) {
    const { editor, isEditable } = useTiptapEditor(config.editor);
    const align = computed(() => toValue(config.align));

    const canAlign = computed(() => isEditable.value && canSetTextAlign(editor.value, align.value));
    const isActive = computed(() => isTextAlignActive(editor.value, align.value));
    const isVisible = computed(() =>
        shouldShowTextAlignButton(
            editor.value,
            align.value,
            toValue(config.hideWhenUnavailable) ?? false,
            isEditable.value,
        ),
    );
    const label = computed(() => TEXT_ALIGN_LABELS[align.value]);
    const icon = computed(() => TEXT_ALIGN_ICONS[align.value]);
    const shortcutKeys = computed(() => getShortcutKeys(TEXT_ALIGN_SHORTCUT_KEYS[align.value]));

    const handleTextAlign = () => {
        const success = setTextAlign(editor.value, align.value);
        if (success) {
            config.onAligned?.();
        }
        return success;
    };

    return {
        isVisible,
        isActive,
        canAlign,
        label,
        icon,
        shortcutKeys,
        handleTextAlign,
    };
}
