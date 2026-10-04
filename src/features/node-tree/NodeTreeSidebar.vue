<script setup lang="ts">
import type { NodeTreeSection } from './use-node-tree';
import type { NodeTreeDto } from '@/stores/nodes';

import NodeTreeHeader from './NodeTreeHeader.vue';
import NodeTreeView from './NodeTreeView.vue';
import { useNodeTree } from './use-node-tree';

const props = defineProps<{
    tree: NodeTreeDto[];
    section: NodeTreeSection;
    active: boolean;
}>();

const {
    query,
    search,
    selected,
    filteredTree,
    hasBranches,
    visibleExpanded,
    canCreate,
    createLabel,
    createError,
    createEntry,
    createFolder,
    expandAll,
    collapseAll,
} = useNodeTree(props);
</script>

<template>
    <NodeTreeHeader
        v-show="active"
        v-model="query"
        :can-create="canCreate"
        :create-error="createError"
        :create-label="createLabel"
        :has-branches="hasBranches"
        :section="section"
        @collapse-all="collapseAll"
        @create-entry="createEntry"
        @create-folder="createFolder"
        @expand-all="expandAll"
    />

    <SidebarContent v-show="active" class="overflow-hidden">
        <ScrollArea
            class="min-h-0 min-w-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:grid-cols-1"
        >
            <div
                v-if="!filteredTree.length"
                class="px-3 py-2 text-xs text-muted-foreground"
                role="status"
            >
                {{ search ? 'No matching items.' : 'No items yet.' }}
            </div>

            <NodeTreeView
                v-model="selected"
                v-model:expanded="visibleExpanded"
                :aria-label="section"
                :tree="filteredTree"
            />
        </ScrollArea>
    </SidebarContent>
</template>
