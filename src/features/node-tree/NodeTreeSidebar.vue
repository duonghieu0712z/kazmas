<script setup lang="ts">
import type { NodeDraft } from './use-create-node';
import type { NodeTreeSection } from './use-node-tree';
import type { NodeTreeDto } from '@/stores/nodes';

import { useWorldStore } from '@/stores/world';

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
    hasBranches,
    visibleExpanded,
    filteredTree,
    revealChildren,
    revealNode,
    expandAll,
    collapseAll,
} = useNodeTree(props);

const world = useWorldStore();
const draft = ref<NodeDraft | null>(null);
const creating = ref(false);
const canCreate = computed(() => world.hasWorld && !draft.value && !creating.value);

function startNode(type: NodeDraft['type']) {
    if (!canCreate.value) {
        return;
    }
    const node = selected.value;
    const parentId = node?.kind === 'folder' ? node.id : (node?.parentId ?? null);
    draft.value = { id: 'node-tree-draft', kind: 'draft', type, parentId };
    revealChildren(parentId);
}
</script>

<template>
    <NodeTreeHeader
        v-show="active"
        v-model="query"
        :can-create="canCreate"
        :has-branches="hasBranches && !draft"
        :section="section"
        @collapse:tree="collapseAll"
        @create:entry="startNode('entry')"
        @create:folder="startNode('folder')"
        @expand:tree="expandAll"
    />

    <SidebarContent v-show="active" class="overflow-hidden">
        <div
            v-if="!filteredTree.length && !draft"
            class="px-3 py-2 text-xs text-muted-foreground"
            role="status"
        >
            {{ search ? 'No matching items.' : 'No items yet.' }}
        </div>

        <NodeTreeView
            v-model="selected"
            v-model:creating="creating"
            v-model:draft="draft"
            v-model:expanded="visibleExpanded"
            :section="section"
            :tree="filteredTree"
            @create:node="revealNode"
        />
    </SidebarContent>
</template>
