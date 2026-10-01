import type { TiptapEditorProps } from '@/components/tiptap/editor';

export { default as CharacterCountIndicator } from './CharacterCountIndicator.vue';
export * from './use-character-count';

export interface CharacterCountIndicatorProps extends TiptapEditorProps {
    showCharacters?: boolean;
    showWords?: boolean;
}
