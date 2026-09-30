<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue';
import { useColorMode } from '@vueuse/core';

import { EditableButton } from '@/components/tiptap/editable';

const marks = ['bold', 'italic', 'underline', 'strike'] as const;
const codeAndScriptMarks = ['code', 'subscript', 'superscript'] as const;

const findAndReplaceOpen = ref(false);
const theme = useColorMode({ initialValue: 'auto' });
const isDark = computed(() => theme.value === 'dark');
const themeIcon = computed(() => (isDark.value ? SunIcon : MoonIcon));
const themeLabel = computed(() => `Switch to ${isDark.value ? 'light' : 'dark'} theme`);

function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark';
}
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
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <BlockquoteButton />
            <CodeBlockButton />
            <HorizontalRuleButton />
            <LinkPopover />
            <RubyTextPopover />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <MarkButton v-for="mark in marks" :key="mark" :type="mark" />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <MarkButton v-for="mark in codeAndScriptMarks" :key="mark" :type="mark" />
            <ResetAllFormattingButton />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <TextAlignPopover />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <ListDropdown />
            <ListPopover />
        </ButtonGroup>

        <ButtonGroupSeparator class="my-1" />

        <ButtonGroup spacing="spaced">
            <EditableButton />
            <InvisibleCharactersButton />
            <TooltipWrapper>
                <Button
                    :aria-label="themeLabel"
                    size="icon"
                    type="button"
                    variant="ghost"
                    @click="toggleTheme"
                >
                    <component :is="themeIcon" />
                </Button>

                <template #tooltip>
                    {{ themeLabel }}
                </template>
            </TooltipWrapper>
        </ButtonGroup>
    </Toolbar>

    <FindAndReplacePanel v-model:open="findAndReplaceOpen" />
</template>
