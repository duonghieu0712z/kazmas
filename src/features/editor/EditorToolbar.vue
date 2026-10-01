<script setup lang="ts">
const marks = ['bold', 'italic', 'underline', 'strike'] as const;
const codeAndScriptMarks = ['code', 'subscript', 'superscript'] as const;

const findAndReplaceOpen = ref(false);
</script>

<template>
    <Toolbar>
        <ButtonGroup spacing="spaced">
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
            <FindAndReplaceButton v-model:open="findAndReplaceOpen" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <HeadingDropdown />
            <ListDropdown />
            <BlockquoteButton />
            <CodeBlockButton />
            <HorizontalRuleButton />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <MarkButton v-for="mark in marks" :key="mark" :type="mark" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <MarkButton v-for="mark in codeAndScriptMarks" :key="mark" :type="mark" />
            <LinkPopover />
            <RubyTextPopover />
            <ResetAllFormattingButton />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <TextAlignPopover />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <InvisibleCharactersButton />
            <EditableButton />
        </ButtonGroup>
    </Toolbar>

    <FindAndReplacePanel v-model:open="findAndReplaceOpen" />
</template>
