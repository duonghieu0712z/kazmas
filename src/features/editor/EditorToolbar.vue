<script setup lang="ts">
import { useSystemFonts } from '@/composables/use-system-fonts';

const marks = ['bold', 'italic', 'underline', 'strike'] as const;
const codeAndScriptMarks = ['code', 'subscript', 'superscript'] as const;
const colorTypes = ['color', 'backgroundColor'] as const;

const findAndReplaceOpen = ref(false);

const { fonts, isLoading: fontsLoading, error: fontsError, loadFonts } = useSystemFonts();

async function handleFontMenuOpen(open: boolean) {
    if (open) {
        await loadFonts();
    }
}
</script>

<template>
    <Toolbar overflow="navigation">
        <ButtonGroup spacing="spaced">
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <HeadingDropdown />
            <FontFamilyCombobox
                :error="!!fontsError"
                :fonts="fonts"
                :loading="fontsLoading"
                @retry="loadFonts"
                @update:open="handleFontMenuOpen"
            />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <MarkButton v-for="mark in marks" :key="mark" :type="mark" />
            <MarkButton v-for="mark in codeAndScriptMarks" :key="mark" :type="mark" />
            <TextStyleColorPopover v-for="type in colorTypes" :key="type" :type="type" />
            <HighlightPopover />
            <ResetAllFormattingButton />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <TextAlignPopover />
            <LineHeightPopover />
            <ListDropdown />
            <BlockquoteButton />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <LinkPopover />
            <RubyTextPopover />
            <CodeBlockButton />
            <HorizontalRuleButton />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <FindAndReplaceButton v-model:open="findAndReplaceOpen" />
            <InvisibleCharactersButton />
            <EditableButton />
        </ButtonGroup>
    </Toolbar>

    <FindAndReplacePanel v-model:open="findAndReplaceOpen" />
</template>
