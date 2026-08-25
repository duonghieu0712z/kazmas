<script setup lang="ts">
import type { CharacterCountIndicatorProps } from '.';

import { useCharacterCount } from './use-character-count';

const props = withDefaults(defineProps<CharacterCountIndicatorProps>(), {
    showCharacters: true,
    showWords: true,
});

const { isAvailable, characterLabel, wordLabel } = useCharacterCount({
    editor: props.editor,
});
</script>

<template>
    <span
        v-if="isAvailable && (showCharacters || showWords)"
        class="flex items-center gap-1.5 tabular-nums"
    >
        <span v-if="showCharacters">{{ characterLabel }}</span>
        <span v-if="showCharacters && showWords" aria-hidden="true">·</span>
        <span v-if="showWords">{{ wordLabel }}</span>
    </span>
</template>
