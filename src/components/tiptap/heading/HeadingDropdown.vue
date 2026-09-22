<script setup lang="ts">
import type { HeadingDropdownProps, HeadingLevel } from '.';

import { ChevronDownIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

import { useHeadingDropdown } from './use-heading-dropdown';

const props = withDefaults(defineProps<HeadingDropdownProps>(), {
    variant: 'ghost',
    levels: () => [1, 2, 3, 4],
    hideWhenUnavailable: false,
    showLabel: true,
    showTooltip: true,
    showShortcut: true,
});

const emits = defineEmits<{
    'update:changed': [level: HeadingLevel];
}>();

const open = ref(false);
const {
    activeLevel,
    canSet,
    isVisible,
    label,
    icon,
    levels,
    getLabel,
    getIcon,
    getShortcutKeys,
    canSetLevel,
    handleLevel,
} = useHeadingDropdown({
    editor: props.editor,
    levels: props.levels,
    hideWhenUnavailable: props.hideWhenUnavailable,
    onChanged: (level) => emits('update:changed', level),
});

const delegatedProps = reactiveOmit(
    props,
    'editor',
    'levels',
    'hideWhenUnavailable',
    'showLabel',
    'showTooltip',
    'showShortcut',
);
const menuLevels = computed<HeadingLevel[]>(() => [0, ...levels.value]);

function changeLevel(level: HeadingLevel) {
    if (handleLevel(level)) {
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
                <Button
                    v-bind="delegatedProps"
                    :aria-label="label"
                    :class="showLabel ? 'relative w-32 justify-start pr-8' : undefined"
                    :disabled="!canSet"
                    :size="showLabel ? 'default' : 'icon'"
                    type="button"
                    variant="outline"
                >
                    <slot>
                        <component :is="icon" />
                        <span v-if="showLabel">{{ label }}</span>
                        <ChevronDownIcon
                            v-if="showLabel"
                            class="absolute right-2 text-muted-foreground"
                        />
                    </slot>
                </Button>

                <template #tooltip>{{ label }}</template>
            </TooltipWrapper>
        </DropdownMenuTrigger>

        <DropdownMenuContent @close-auto-focus="handleCloseAutoFocus">
            <DropdownMenuItem
                v-for="level in menuLevels"
                :key="level"
                :class="
                    activeLevel === level
                        ? 'bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary'
                        : undefined
                "
                :disabled="!canSetLevel(level)"
                @select="changeLevel(level)"
            >
                <component :is="getIcon(level)" />
                <span>{{ getLabel(level) }}</span>
                <KbdGroup v-if="showShortcut" class="ml-auto">
                    <Kbd v-for="key in getShortcutKeys(level)" :key="key">{{ key }}</Kbd>
                </KbdGroup>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
