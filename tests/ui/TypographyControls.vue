<script setup lang="ts">
import { DocumentTextSizePopover } from '@/components/tiptap/document-text-size';
import { createEditorOptions, EditorContent, EditorProvider } from '@/components/tiptap/editor';
import { FontSizeCombobox } from '@/components/tiptap/font-size';
import { ButtonGroup } from '@/components/ui/button-group';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createEditorExtensions } from '@/features/editor/options';

import '@/styles/globals.css';

const options = createEditorOptions({
    extensions: createEditorExtensions(),
    content: '<p>Before target after</p>',
});
</script>

<template>
    <TooltipProvider>
        <EditorProvider :options="options">
            <ButtonGroup class="p-2" spacing="spaced">
                <FontSizeCombobox />
                <DocumentTextSizePopover :preset-count="5" />
            </ButtonGroup>

            <EditorContent />
        </EditorProvider>
    </TooltipProvider>
</template>
