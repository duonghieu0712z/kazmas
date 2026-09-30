import type { UseCharacterCountConfig } from './use-character-count';

export { default as CharacterCountIndicator } from './CharacterCountIndicator.vue';
export * from './use-character-count';

export interface CharacterCountIndicatorProps extends UseCharacterCountConfig {
    showCharacters?: boolean;
    showWords?: boolean;
}
