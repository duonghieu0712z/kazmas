<script setup lang="ts">
import type { NodeTreeDto } from '@/stores/nodes';
import type { TreeItemSelectEvent } from 'reka-ui';

import { FileIcon, FolderIcon, FolderOpenIcon } from '@lucide/vue';

import { useNodeStore } from '@/stores/nodes';

defineProps<{
    tree: NodeTreeDto[];
}>();

const nodes = useNodeStore();

function getKey(node: NodeTreeDto) {
    return node.id;
}

function selectNode(event: TreeItemSelectEvent<NodeTreeDto>) {
    const node = event.detail.value;
    if (node) {
        nodes.selectedNodeId = node.id;
    }
}
</script>

<template>
    <SidebarContent>
        <ScrollArea class="h-full min-w-0 flex-1">
            <TreeRoot
                v-slot="{ flattenItems }"
                chevron
                :get-key="getKey"
                indent-guide
                :items="tree"
                selection-behavior="replace"
            >
                <TreeItem
                    v-for="item in flattenItems"
                    v-bind="item.bind"
                    :key="item._id"
                    v-slot="{ isExpanded }"
                    @select="selectNode"
                >
                    <span class="inline-flex min-w-0 flex-1 items-center gap-2">
                        <template v-if="item.value.kind === 'folder'">
                            <FolderOpenIcon v-if="isExpanded" class="size-4 shrink-0" />
                            <FolderIcon v-else class="size-4 shrink-0" />
                        </template>
                        <FileIcon v-else class="size-4 shrink-0" />
                        <span class="truncate">{{ item.value.name }}</span>
                    </span>
                </TreeItem>
            </TreeRoot>
        </ScrollArea>
    </SidebarContent>
</template>
