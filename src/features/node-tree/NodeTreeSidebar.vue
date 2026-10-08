<script setup lang="ts">
import type { NodeDraft } from './use-create-node';
import type { NodeTreeSection } from './use-node-tree';
import type { NodeTreeDto } from '@/stores/nodes';

import { useContextMenuProvider } from '@/providers/context-menu';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import { createNodeTreeMenuItems } from './node-tree-menu';
import NodeTreeHeader from './NodeTreeHeader.vue';
import NodeTreeView from './NodeTreeView.vue';
import { useNodeTree } from './use-node-tree';
import { useNodeTreeActions } from './use-node-tree-actions';

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
const nodes = useNodeStore();
const actions = useNodeTreeActions(() => props.tree);
const draft = ref<NodeDraft | null>(null);
const creating = ref(false);
const canCreate = computed(
    () => world.hasWorld && !draft.value && !creating.value && !actions.busy.value,
);
const { openContextMenu } = useContextMenuProvider();

function showMenu(event: MouseEvent, node?: NodeTreeDto) {
    const worldId = world.manifest?.id;
    openContextMenu({
        event,
        items: () =>
            createNodeTreeMenuItems(
                node,
                canCreate.value,
                world.hasWorld && !actions.busy.value && !draft.value && !creating.value,
                {
                    open: (id) => {
                        if (world.manifest?.id === worldId) {
                            actions.open(id);
                        }
                    },
                    create: (type, parentId, entryKind) => {
                        if (world.manifest?.id !== worldId) {
                            return;
                        }
                        if (type === 'entry' && !parentId && entryKind) {
                            nodes.createEntryInTree(entryKind);
                        } else {
                            startNodeAt(type, parentId, entryKind);
                        }
                    },
                    rename: async (id) => {
                        if (world.manifest?.id === worldId) {
                            await actions.rename(id);
                        }
                    },
                    trash: async (id) => {
                        if (world.manifest?.id === worldId) {
                            await actions.trash(id);
                        }
                    },
                },
            ),
    });
}

watch(
    () => nodes.treeRequest,
    (request) => {
        if (request?.action === 'reveal') {
            revealNode(request.nodeId, false);
        } else if (request?.action === 'create' && request.section === props.section) {
            startNodeAt('entry', null, request.entryKind);
        }
    },
);

function startNodeAt(
    type: NodeDraft['type'],
    parentId: string | null,
    entryKind?: NodeDraft['entryKind'],
) {
    if (!canCreate.value || (parentId && nodes.getNode(parentId)?.kind !== 'folder')) {
        return;
    }
    draft.value = { id: 'node-tree-draft', kind: 'draft', type, parentId, entryKind };
    revealChildren(parentId);
}

function startNode(type: NodeDraft['type']) {
    if (!canCreate.value) {
        return;
    }
    const node = selected.value;
    const parentId = node?.kind === 'folder' ? node.id : (node?.parentId ?? null);
    startNodeAt(type, parentId);
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

    <SidebarContent v-show="active" class="overflow-hidden" @contextmenu="showMenu($event)">
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
            @contextmenu:node="showMenu"
            @create:node="revealNode"
        />
        <p v-if="actions.error.value" class="px-3 py-2 text-xs text-destructive" role="alert">
            {{ actions.error.value }}
        </p>
    </SidebarContent>
</template>
