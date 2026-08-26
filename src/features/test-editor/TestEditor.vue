<script setup lang="ts">
import { testEditorOptions } from './options';
import TestToolbar from './TestToolbar.vue';

const findAndReplaceOpen = ref(false);
</script>

<template>
    <div class="relative flex h-full min-w-0 flex-col overflow-hidden">
        <EditorProvider :options="testEditorOptions">
            <TestToolbar
                :find-and-replace-open="findAndReplaceOpen"
                @update:find-and-replace-open="findAndReplaceOpen = $event"
            />

            <FindAndReplacePanel v-model:open="findAndReplaceOpen" />

            <ScrollArea class="min-h-0 min-w-0 flex-1 overflow-hidden" horizontal>
                <div class="flex min-h-full w-full min-w-max items-stretch justify-center p-2">
                    <EditorContent class="w-3xl shrink-0 cursor-text self-stretch border" />
                </div>
            </ScrollArea>

            <Teleport defer to="#app-status-bar">
                <CharacterCountIndicator />
            </Teleport>
        </EditorProvider>
    </div>
</template>
