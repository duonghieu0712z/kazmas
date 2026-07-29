<script setup lang="ts">
import { testEditorOptions } from './options';
import TestToolbar from './TestToolbar.vue';
</script>

<template>
    <div class="flex h-full min-w-0 flex-col overflow-hidden">
        <EditorProvider :options="testEditorOptions">
            <TestToolbar />

            <ScrollArea class="min-h-0 min-w-0 flex-1 overflow-hidden" horizontal>
                <div class="flex min-h-full w-full min-w-max items-stretch justify-center p-2">
                    <EditorContent class="w-3xl shrink-0 cursor-text self-stretch border" />
                </div>
            </ScrollArea>
        </EditorProvider>
    </div>
</template>
