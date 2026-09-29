<script setup lang="ts">
import type { ListPopoverProps, ListType } from '.';

import { ChevronDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

import ListGroup from './ListGroup.vue';
import { useLists } from './use-lists';

const props = withDefaults(defineProps<ListPopoverProps>(), {
    variant: 'default',
    types: () => ['bulletList', 'orderedList', 'taskList'],
    orientation: 'horizontal',
    hideWhenUnavailable: false,
    showTooltip: true,
});

const emits = defineEmits<{
    'update:toggled': [type: ListType];
}>();

const open = ref(false);
const { activeType, canToggle, isVisible, label, icon } = useLists({
    editor: props.editor,
    types: props.types,
    hideWhenUnavailable: props.hideWhenUnavailable,
});
const delegatedProps = reactiveOmit(
    props,
    'editor',
    'types',
    'orientation',
    'hideWhenUnavailable',
    'showTooltip',
);

function handleToggled(type: ListType) {
    open.value = false;
    emits('update:toggled', type);
}

function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
}
</script>

<template>
    <Popover v-if="isVisible" v-model:open="open">
        <PopoverTrigger as="div">
            <TooltipWrapper :show-tooltip="showTooltip">
                <Toggle
                    v-bind="delegatedProps"
                    :aria-label="label"
                    class="gap-0.5"
                    :disabled="!canToggle"
                    :model-value="Boolean(activeType) || open"
                    size="default"
                >
                    <slot>
                        <component :is="icon" />
                        <ChevronDownIcon class="size-3 text-muted-foreground" />
                    </slot>
                </Toggle>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </PopoverTrigger>

        <PopoverContent align="start" class="w-auto p-1" @close-auto-focus="handleCloseAutoFocus">
            <ListGroup
                :editor="editor"
                :orientation="orientation"
                :types="types"
                @update:toggled="handleToggled"
            />
        </PopoverContent>
    </Popover>
</template>
