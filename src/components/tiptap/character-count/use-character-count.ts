import type { Editor } from '@tiptap/vue-3';
import type { MaybeRefOrGetter } from 'vue';

import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';

export interface UseCharacterCountConfig {
    editor?: MaybeRefOrGetter<Editor>;
}

function formatCount(count: number, name: string) {
    return `${count.toLocaleString()} ${name}${count === 1 ? '' : 's'}`;
}

export function useCharacterCount(config: UseCharacterCountConfig) {
    const editor = useTiptapEditor(config.editor);

    const isAvailable = computed(() => Boolean(editor.value?.storage.characterCount));
    const characters = computed(() => editor.value?.storage.characterCount?.characters() ?? 0);
    const words = computed(() => editor.value?.storage.characterCount?.words() ?? 0);
    const characterLabel = computed(() => formatCount(characters.value, 'character'));
    const wordLabel = computed(() => formatCount(words.value, 'word'));

    return {
        isAvailable,
        characters,
        words,
        characterLabel,
        wordLabel,
    };
}
