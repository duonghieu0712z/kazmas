<script setup lang="ts">
import type { NodeTreeSection } from './use-node-tree';

import {
    ChevronsDownUpIcon,
    ChevronsUpDownIcon,
    FilePlusIcon,
    FolderPlusIcon,
    SearchIcon,
    XIcon,
} from '@lucide/vue';

const props = defineProps<{
    section: NodeTreeSection;
    canCreate: boolean;
    hasBranches: boolean;
}>();

const emits = defineEmits<{
    'create:entry': [];
    'create:folder': [];
    'expand:tree': [];
    'collapse:tree': [];
}>();

const query = defineModel<string>({ default: '' });

const actions = computed(() => [
    {
        id: 'createEntry',
        label: `New ${props.section.toLowerCase()} entry`,
        icon: FilePlusIcon,
        disabled: !props.canCreate,
        onClick: () => emits('create:entry'),
    },
    {
        id: 'createFolder',
        label: 'New folder',
        icon: FolderPlusIcon,
        disabled: !props.canCreate,
        onClick: () => emits('create:folder'),
    },
    {
        id: 'expandAll',
        label: 'Expand all',
        icon: ChevronsUpDownIcon,
        disabled: !props.hasBranches,
        onClick: () => emits('expand:tree'),
    },
    {
        id: 'collapseAll',
        label: 'Collapse all',
        icon: ChevronsDownUpIcon,
        disabled: !props.hasBranches,
        onClick: () => emits('collapse:tree'),
    },
]);
</script>

<template>
    <SidebarHeader class="shrink-0 gap-0 border-b bg-muted p-0">
        <div class="flex h-7 items-center justify-between gap-2 px-2">
            <span class="truncate text-xs font-medium text-foreground">{{ section }}</span>

            <ButtonGroup aria-label="Tree actions" class="shrink-0" spacing="spaced">
                <Tooltip v-for="action in actions" :key="action.id">
                    <TooltipTrigger>
                        <Button
                            :aria-label="action.label"
                            class="size-5 text-muted-foreground"
                            :disabled="action.disabled"
                            size="icon"
                            variant="ghost"
                            @click="action.onClick"
                        >
                            <component :is="action.icon" class="size-3.5" />
                        </Button>
                    </TooltipTrigger>

                    <TooltipContent>{{ action.label }}</TooltipContent>
                </Tooltip>
            </ButtonGroup>
        </div>

        <div class="px-2 pb-1">
            <InputGroup class="h-6 bg-muted/50 shadow-none">
                <InputGroupAddon>
                    <SearchIcon class="size-3" />
                </InputGroupAddon>

                <InputGroupInput
                    v-model="query"
                    :aria-label="`Filter ${section.toLowerCase()}`"
                    class="h-6 text-xs md:text-xs"
                    placeholder="Filter..."
                    @keydown.esc.stop="query = ''"
                />

                <InputGroupAddon v-if="query" align="inline-end" class="py-0 pr-0.5">
                    <Tooltip>
                        <TooltipTrigger>
                            <InputGroupButton
                                aria-label="Clear filter"
                                class="size-5 text-muted-foreground"
                                size="icon"
                                @click="query = ''"
                            >
                                <XIcon class="size-3" />
                            </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>Clear filter</TooltipContent>
                    </Tooltip>
                </InputGroupAddon>
            </InputGroup>
        </div>
    </SidebarHeader>
</template>
