<script setup lang="ts">
import { useColorMode, useStyleTag } from '@vueuse/core';

import githubDarkTheme from 'highlight.js/styles/github-dark.css?inline';
import githubTheme from 'highlight.js/styles/github.css?inline';

const theme = useColorMode({ initialValue: 'auto' });
const highlightTheme = computed(() => (theme.value === 'dark' ? githubDarkTheme : githubTheme));

useStyleTag(highlightTheme, { id: 'highlight-theme' });
</script>

<template>
    <slot />
</template>
