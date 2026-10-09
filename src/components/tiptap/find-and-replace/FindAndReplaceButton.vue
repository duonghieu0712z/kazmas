<script setup lang="ts">
import type { FindAndReplaceButtonProps } from '.';

import { SearchIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { computed } from 'vue';

import { useTiptapEditor } from '@/components/tiptap/editor';
import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';
import { getShortcutKeys } from '@/utils/shortcut';

import {
    FIND_AND_REPLACE_LABEL,
    FIND_AND_REPLACE_SHORTCUT_KEY,
    isFindAndReplaceAvailable,
    shouldShowFindAndReplace,
} from './use-find-and-replace';

const props = withDefaults(defineProps<FindAndReplaceButtonProps>(), {
    variant: 'default',
    open: false,
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:open': [open: boolean];
}>();

const { editor } = useTiptapEditor(() => props.editor);

const isAvailable = computed(() => isFindAndReplaceAvailable(editor.value));
const isVisible = computed(() => shouldShowFindAndReplace(editor.value, props.hideWhenUnavailable));

const shortcutKeys = getShortcutKeys(FIND_AND_REPLACE_SHORTCUT_KEY);

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'open',
    'hideWhenUnavailable',
    'showLabel',
    'showTooltip',
    'showShortcut',
);

function handleOpenChange(open: boolean) {
    emits('update:open', open);
}
</script>

<template>
    <TooltipWrapper
        v-if="isVisible"
        :shortcut-keys="shortcutKeys"
        :show-shortcut="showShortcut"
        :show-tooltip="showTooltip"
    >
        <Toggle
            v-bind="delegatedProps"
            :aria-label="FIND_AND_REPLACE_LABEL"
            class="text-editor-toolbar-foreground"
            :disabled="!isAvailable"
            :model-value="open"
            :size="showLabel ? 'default' : 'icon'"
            @update:model-value="handleOpenChange"
        >
            <slot>
                <SearchIcon />
            </slot>
            <span v-if="showLabel">{{ FIND_AND_REPLACE_LABEL }}</span>
        </Toggle>

        <template #tooltip>
            {{ FIND_AND_REPLACE_LABEL }}
        </template>
    </TooltipWrapper>
</template>
