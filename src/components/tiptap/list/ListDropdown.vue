<script setup lang="ts">
import type { ListDropdownProps, ListType } from '.';

import { ChevronDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Toggle } from '@/components/ui/toggle';

import { useLists } from './use-lists';

const props = withDefaults(defineProps<ListDropdownProps>(), {
    variant: 'default',
    types: () => ['bulletList', 'orderedList', 'taskList'],
    hideWhenUnavailable: false,
    showLabel: false,
    showTooltip: true,
    showShortcut: false,
});

const emits = defineEmits<{
    'update:toggled': [type: ListType];
}>();

const open = ref(false);
const {
    activeType,
    canToggle,
    isVisible,
    label,
    icon,
    types,
    getLabel,
    getIcon,
    getShortcutKeys,
    canToggleType,
    handleList,
} = useLists({
    editor: props.editor,
    types: props.types,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onToggled: (type) => emits('update:toggled', type),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'types',
    'hideWhenUnavailable',
    'showLabel',
    'showTooltip',
    'showShortcut',
);

function toggleType(type: ListType) {
    if (handleList(type)) {
        open.value = false;
    }
}

function handleCloseAutoFocus(event: Event) {
    event.preventDefault();
}
</script>

<template>
    <DropdownMenu v-if="isVisible" v-model:open="open">
        <DropdownMenuTrigger as="div">
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
                        <span v-if="showLabel">{{ label }}</span>
                        <ChevronDownIcon class="size-3 text-muted-foreground" />
                    </slot>
                </Toggle>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" @close-auto-focus="handleCloseAutoFocus">
            <DropdownMenuItem
                v-for="type in types"
                :key="type"
                :class="
                    activeType === type
                        ? 'bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary'
                        : undefined
                "
                :disabled="!canToggleType(type)"
                @select="toggleType(type)"
            >
                <component :is="getIcon(type)" />
                <span>{{ getLabel(type) }}</span>
                <KbdGroup v-if="showShortcut" class="ml-auto">
                    <Kbd v-for="key in getShortcutKeys(type)" :key="key">{{ key }}</Kbd>
                </KbdGroup>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
