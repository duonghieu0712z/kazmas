<script setup lang="ts">
import type { NodeTreeDto } from '@/stores/nodes';
import type { TreeItemSelectEvent } from 'reka-ui';

import { FileIcon, FolderIcon, FolderOpenIcon } from '@lucide/vue';

import { useNodeStore } from '@/stores/nodes';

import NodeTreeLabel from './NodeTreeLabel.vue';

defineProps<{ tree: NodeTreeDto[] }>();

const selected = defineModel<NodeTreeDto>();
const expanded = defineModel<string[]>('expanded', { default: () => [] });

const nodes = useNodeStore();

function getKey(node: NodeTreeDto) {
    return node.id;
}

function selectNode(event: TreeItemSelectEvent<NodeTreeDto>) {
    const node = event.detail.value;

    if (node) {
        nodes.selectNode(node);
        nodes.openNode(node);
    }
}
</script>

<template>
    <TreeRoot
        v-slot="{ flattenItems }"
        v-model="selected"
        v-model:expanded="expanded"
        chevron
        class="p-1"
        expand-on-chevron-only
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
                    <FolderOpenIcon v-if="isExpanded" class="size-3.5 shrink-0" />
                    <FolderIcon v-else class="size-3.5 shrink-0" />
                </template>
                <FileIcon v-else class="size-3.5 shrink-0" />

                <NodeTreeLabel :name="item.value.name" />
            </span>
        </TreeItem>
    </TreeRoot>
</template>
