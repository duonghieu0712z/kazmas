import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed, nextTick, ref, toValue, watch } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseFontFamilyConfig {
    editor?: MaybeRefOrGetter<Editor | undefined>;
    hideWhenUnavailable?: MaybeRefOrGetter<boolean | undefined>;
    onChanged?: (fontFamily: string | null) => void;
}

export function isFontFamilyAvailable(editor: Editor | null) {
    return (
        !!editor &&
        !editor.isDestroyed &&
        !!editor.schema.marks.textStyle &&
        'setFontFamily' in editor.commands &&
        'unsetFontFamily' in editor.commands
    );
}

export function canSetFontFamily(editor: Editor | null) {
    return (
        isFontFamilyAvailable(editor) &&
        !!editor?.isEditable &&
        !editor.isActive('code') &&
        !editor.isActive('codeBlock') &&
        editor.can().setFontFamily('inherit')
    );
}

export function setFontFamily(editor: Editor | null, fontFamily: string | null) {
    if (!editor || !canSetFontFamily(editor)) {
        return false;
    }

    if (fontFamily === null) {
        return editor.chain().focus().unsetFontFamily().run();
    }

    return editor.chain().focus().setFontFamily(fontFamily).run();
}

export function useFontFamily(config: UseFontFamilyConfig = {}) {
    const { editor, isEditable } = useTiptapEditor(config.editor);

    const defaultFontFamily = ref('');

    watch(
        editor,
        async () => {
            await nextTick();

            const currentEditor = editor.value;

            if (!currentEditor || currentEditor.isDestroyed) {
                defaultFontFamily.value = '';
                return;
            }

            defaultFontFamily.value = getComputedStyle(currentEditor.view.dom).fontFamily;
        },
        { immediate: true, flush: 'post' },
    );

    const defaultLabel = computed(() => {
        const family = defaultFontFamily.value
            .split(',')[0]
            ?.trim()
            .replace(/^['"]|['"]$/g, '');

        return family ? `Default · ${family}` : 'Default';
    });

    const activeFontFamily = computed<string | null | undefined>(() => {
        if (!isFontFamilyAvailable(editor.value)) {
            return undefined;
        }

        const family = editor.value!.getAttributes('textStyle').fontFamily as string | undefined;

        if (!family) {
            return null;
        }

        return editor.value!.isActive('textStyle', { fontFamily: family }) ? family : undefined;
    });

    const canSet = computed(() => isEditable.value && canSetFontFamily(editor.value));
    const isVisible = computed(
        () =>
            isFontFamilyAvailable(editor.value) &&
            (!toValue(config.hideWhenUnavailable) || !isEditable.value || canSet.value),
    );

    const label = computed(() => {
        if (activeFontFamily.value === undefined) {
            return 'Font';
        }

        return activeFontFamily.value ?? defaultLabel.value;
    });

    const handleFontFamily = (fontFamily: string | null) => {
        const success = setFontFamily(editor.value, fontFamily);

        if (success) {
            config.onChanged?.(fontFamily);
        }

        return success;
    };

    return {
        activeFontFamily,
        defaultFontFamily,
        defaultLabel,
        canSet,
        isVisible,
        label,
        handleFontFamily,
    };
}
