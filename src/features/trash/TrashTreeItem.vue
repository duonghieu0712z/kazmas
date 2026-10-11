<script setup lang="ts">
import type { NodeTreeDto } from '@/stores/nodes';
import type { FlattenedItem, TreeItemSelectEvent } from 'reka-ui';

import { getNodeIcon } from '@/lib/node-icons';
import { useNodeStore } from '@/stores/nodes';

defineProps<{ item: FlattenedItem<NodeTreeDto> }>();

const emits = defineEmits<{ 'contextmenu:node': [event: MouseEvent, node: NodeTreeDto] }>();

const nodes = useNodeStore();

function selectNode(event: TreeItemSelectEvent<NodeTreeDto>) {
    const node = event.detail.value;
    if (node) {
        nodes.selectNode(node);
    }
}
</script>

<template>
    <TreeItem
        v-slot="{ isExpanded }"
        v-bind="item.bind"
        :aria-label="item.value.name"
        @contextmenu="emits('contextmenu:node', $event, item.value)"
        @dblclick="nodes.openNode(item.value)"
        @keydown.enter="nodes.openNode(item.value)"
        @select="selectNode"
    >
        <span class="inline-flex min-w-0 flex-1 items-center gap-2">
            <component :is="getNodeIcon(item.value.kind, isExpanded)" class="size-3.5 shrink-0" />

            <Tooltip>
                <TooltipTrigger as="span" class="min-w-0 flex-1 truncate">
                    {{ item.value.name }}
                </TooltipTrigger>

                <TooltipContent class="max-w-80 wrap-break-word" side="right">
                    <p>{{ item.value.name }}</p>
                    <p v-if="nodes.trashLocations.get(item.value.id)?.path">
                        Original location: {{ nodes.trashLocations.get(item.value.id)?.path }}
                    </p>
                </TooltipContent>
            </Tooltip>
        </span>
    </TreeItem>
</template>
