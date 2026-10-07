<script setup lang="ts">
import type { NodeTreeDto } from '@/stores/nodes';

import { getNodeIcon } from '@/lib/node-icons';
import { useNodeStore } from '@/stores/nodes';

const props = defineProps<{ items: NodeTreeDto[]; currentNodeId?: string }>();
const nodes = useNodeStore();
const visibleItems = computed(() => props.items.filter((item) => item.id !== props.currentNodeId));

function canOpenFolder(item: NodeTreeDto) {
    return item.children.some((child) => child.id !== props.currentNodeId);
}
</script>

<template>
    <ScrollArea
        :class="[
            '**:data-[slot=scroll-area-viewport]:max-h-[min(20rem,calc(var(--reka-dropdown-menu-content-available-height)-2px))]',
            '**:data-[slot=scroll-area-viewport]:p-1',
        ]"
    >
        <template v-for="item in visibleItems" :key="item.id">
            <DropdownMenuSub v-if="item.kind === 'folder' && canOpenFolder(item)">
                <DropdownMenuSubTrigger class="h-5 py-0 text-xs" :text-value="item.name">
                    <component :is="getNodeIcon(item.kind)" class="size-3.5" />
                    <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent class="max-w-72 min-w-48 overflow-hidden p-0">
                    <NodeBreadcrumbMenu :current-node-id="currentNodeId" :items="item.children" />
                </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem
                v-else
                class="h-5 py-0 text-xs"
                :disabled="item.kind === 'folder'"
                :text-value="item.name"
                @select="nodes.openNode(item)"
            >
                <component :is="getNodeIcon(item.kind)" class="size-3.5" />
                <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
            </DropdownMenuItem>
        </template>
    </ScrollArea>
</template>
