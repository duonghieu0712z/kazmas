<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue';
import { useColorMode } from '@vueuse/core';

withDefaults(
    defineProps<{
        findAndReplaceOpen?: boolean;
    }>(),
    {
        findAndReplaceOpen: false,
    },
);

const emits = defineEmits<{
    'update:findAndReplaceOpen': [open: boolean];
}>();

const marks = ['bold', 'italic', 'underline', 'strike'] as const;
const codeAndScriptMarks = ['code', 'subscript', 'superscript'] as const;

const theme = useColorMode({ initialValue: 'auto' });
const isDark = computed(() => theme.value === 'dark');
const themeIcon = computed(() => (isDark.value ? SunIcon : MoonIcon));
const themeLabel = computed(() => `Switch to ${isDark.value ? 'light' : 'dark'} theme`);

function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark';
}

function updateFindAndReplaceOpen(open: boolean) {
    emits('update:findAndReplaceOpen', open);
}
</script>

<template>
    <ButtonGroup
        class="h-auto min-h-9 w-full shrink-0 flex-wrap content-center items-center justify-center border-b px-2 py-1 has-[>[data-slot=button-group]]:shrink-0 has-[>[data-slot=button-group]]:gap-0.5"
        spacing="spaced"
    >
        <ButtonGroup spacing="spaced">
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
            <FindAndReplaceButton
                :open="findAndReplaceOpen"
                @update:open="updateFindAndReplaceOpen"
            />
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
    </ButtonGroup>
</template>
