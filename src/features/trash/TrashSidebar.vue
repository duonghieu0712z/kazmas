<script setup lang="ts">
import type { MenuItem } from '@/menus';
import type { NodeTreeDto } from '@/stores/nodes';

import { useTrashActions } from '@/actions/trash';
import { useContextMenuProvider } from '@/providers/context-menu';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import TrashHeader from './TrashHeader.vue';
import TrashTreeView from './TrashTreeView.vue';
import { useTrashTree } from './use-trash-tree';

defineProps<{ active: boolean }>();

const nodes = useNodeStore();
const world = useWorldStore();
const actions = useTrashActions();
const { openContextMenu } = useContextMenuProvider();
const { query, selected, filteredGroups, expanded, expandGroup, collapseGroup } = useTrashTree();

function showMenu(event: MouseEvent, node: NodeTreeDto) {
    const worldId = world.manifest?.id;
    openContextMenu({
        event,
        items: (): MenuItem[] => {
            const current = nodes.trashNodes.find((item) => item.id === node.id);
            const enabled =
                !actions.busy &&
                world.manifest?.id === worldId &&
                !!current &&
                !nodes.trashNodes.some((item) => item.id === current.parentId);
            return [
                {
                    type: 'item',
                    id: 'restore',
                    text: 'Restore',
                    enabled,
                    command: {
                        type: 'frontend',
                        id: 'restore',
                        execute: async () => {
                            if (enabled && world.manifest?.id === worldId) {
                                await actions.restore(node.id);
                            }
                        },
                    },
                },
                {
                    type: 'item',
                    id: 'delete-permanently',
                    text: 'Delete Permanently',
                    enabled,
                    variant: 'destructive',
                    command: {
                        type: 'frontend',
                        id: 'delete-permanently',
                        execute: async () => {
                            if (enabled && world.manifest?.id === worldId) {
                                await actions.purge(node.id);
                            }
                        },
                    },
                },
            ];
        },
    });
}
</script>

<template>
    <TrashHeader
        v-show="active"
        v-model="query"
        :can-modify="world.hasWorld && !!nodes.trashNodes.length && !actions.busy"
        @empty:trash="actions.empty"
        @restore:all="actions.restoreAll"
    />

    <SidebarContent v-show="active" aria-label="Trash" class="gap-0 overflow-hidden" role="region">
        <p v-if="!world.hasWorld" class="p-3 text-xs text-muted-foreground">
            Open a world to view Trash.
        </p>

        <div v-else-if="nodes.trashError" class="space-y-2 p-3">
            <p class="text-xs text-destructive" role="alert">{{ nodes.trashError }}</p>
            <Button
                class="h-6 text-xs"
                :disabled="actions.busy"
                variant="ghost"
                @click="nodes.loadTrash"
            >
                Retry
            </Button>
        </div>

        <p v-else-if="!nodes.trashNodes.length" class="p-3 text-xs text-muted-foreground">
            Trash is empty.
        </p>

        <p
            v-else-if="!filteredGroups.some((group) => group.items.length)"
            class="p-3 text-xs text-muted-foreground"
        >
            No matching items.
        </p>

        <TrashTreeView
            v-model="selected"
            v-model:expanded="expanded"
            :groups="filteredGroups"
            @collapse:group="collapseGroup"
            @contextmenu:node="showMenu"
            @expand:group="expandGroup"
        />
    </SidebarContent>
</template>
