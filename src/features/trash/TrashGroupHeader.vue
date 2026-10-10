<script setup lang="ts">
import type { TrashGroup } from './use-trash-tree';

import { ChevronRightIcon, ChevronsDownUpIcon, ChevronsUpDownIcon } from '@lucide/vue';

const props = defineProps<{ group: TrashGroup }>();
const emits = defineEmits<{ 'expand:tree': []; 'collapse:tree': [] }>();
const open = defineModel<boolean>({ required: true });

const hasBranches = computed(() => props.group.items.some((node) => node.children.length));

const actions = [
    { label: 'Expand all', icon: ChevronsUpDownIcon, execute: () => emits('expand:tree') },
    { label: 'Collapse all', icon: ChevronsDownUpIcon, execute: () => emits('collapse:tree') },
];
</script>

<template>
    <SidebarGroupLabel class="h-6 justify-between gap-2 rounded-none bg-muted px-2">
        <Button
            :aria-controls="group.id"
            :aria-expanded="open"
            :aria-label="`Toggle ${group.name} trash`"
            :class="[
                'h-6 min-w-0 flex-1 justify-start gap-2 rounded-none p-0 text-xs',
                'hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit',
            ]"
            variant="ghost"
            @click="open = !open"
        >
            <ChevronRightIcon :class="['size-3.5 transition-transform', open && 'rotate-90']" />
            {{ group.name }}
        </Button>

        <ButtonGroup
            v-if="open"
            :aria-label="`${group.name} trash actions`"
            class="shrink-0"
            spacing="spaced"
        >
            <Tooltip v-for="action in actions" :key="action.label">
                <TooltipTrigger>
                    <Button
                        :aria-label="action.label"
                        class="size-5 text-muted-foreground"
                        :disabled="!hasBranches"
                        size="icon"
                        variant="ghost"
                        @click="action.execute"
                    >
                        <component :is="action.icon" class="size-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{{ action.label }}</TooltipContent>
            </Tooltip>
        </ButtonGroup>
    </SidebarGroupLabel>
</template>
