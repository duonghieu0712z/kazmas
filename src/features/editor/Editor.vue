<script setup lang="ts">
import type { Content } from '@tiptap/vue-3';

defineProps<{ content?: Content }>();
</script>

<template>
    <EditorProvider :content="content">
        <EditorContent />
    </EditorProvider>
</template>
