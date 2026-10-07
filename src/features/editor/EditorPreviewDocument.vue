<script setup lang="ts">
import { createEditorOptions } from '@/components/tiptap/editor';

import EditorToolbar from './EditorToolbar.vue';
import { createEditorExtensions } from './options';

const props = defineProps<{ content: string }>();

const options = createEditorOptions({
    content: props.content,
    extensions: createEditorExtensions(),
    autofocus: false,
});
</script>

<template>
    <div class="relative flex h-full min-w-0 flex-col overflow-hidden">
        <EditorProvider :options="options">
            <EditorToolbar />

            <ScrollArea class="min-h-0 min-w-0 flex-1 overflow-hidden" orientation="both">
                <div class="flex min-h-full w-full min-w-max items-stretch justify-center p-2">
                    <EditorContent
                        class="w-3xl shrink-0 cursor-text self-stretch border border-editor-border"
                    />
                </div>
            </ScrollArea>

            <Teleport defer to="#app-status-bar">
                <CharacterCountIndicator />
            </Teleport>
        </EditorProvider>
    </div>
</template>
