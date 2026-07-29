<script setup lang="ts">
const marks = ['bold', 'italic', 'underline', 'strike'] as const;
const codeAndScriptMarks = ['code', 'subscript', 'superscript'] as const;
const headingLevels = [1, 2, 3, 4] as const;
const textAlignments = ['left', 'center', 'right', 'justify'] as const;
</script>

<template>
    <ButtonGroup
        class="h-9 w-full shrink-0 items-center justify-center border-b px-2 has-[>[data-slot=button-group]]:gap-0.5"
        spacing="spaced"
    >
        <ButtonGroup spacing="spaced">
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <ParagraphButton />
            <HeadingButton v-for="level in headingLevels" :key="level" :level="level" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <BlockquoteButton />
            <CodeBlockButton />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <MarkButton v-for="mark in marks" :key="mark" :type="mark" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <MarkButton v-for="mark in codeAndScriptMarks" :key="mark" :type="mark" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <TextAlignButton v-for="align in textAlignments" :key="align" :align="align" />
        </ButtonGroup>
    </ButtonGroup>
</template>
