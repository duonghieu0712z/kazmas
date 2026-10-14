<script setup lang="ts">
import type { NodePathItem, NodeTreeDto } from '@/stores/nodes';

import { useNodeStore } from '@/stores/nodes';

import NodeBreadcrumbMenu from './NodeBreadcrumbMenu.vue';

const props = defineProps<{ path?: NodePathItem[] }>();

const nodes = useNodeStore();

const path = computed(() => props.path ?? nodes.openedNodePath);
const currentNodeId = computed(() => path.value.at(-1)?.id);
const crumbs = computed(() => {
    const root = path.value[0]?.id;
    const section = root === 'Trash' ? path.value[1]?.name : undefined;
    let siblings: NodeTreeDto[] =
        root === 'Trash'
            ? nodes.trashTree.filter(
                  (node) => nodes.trashLocations.get(node.id)?.section === section,
              )
            : root === 'Wiki'
              ? nodes.wikis
              : nodes.manuscripts;
    return path.value.map((item, index) => {
        const items = siblings;
        if (index > (root === 'Trash' ? 1 : 0)) {
            siblings = siblings.find((node) => node.id === item.id)?.children ?? [];
        }
        return { ...item, items };
    });
});
</script>

<template>
    <Breadcrumb v-if="crumbs.length" class="min-w-0">
        <BreadcrumbList class="flex-nowrap text-xs text-content-header-muted-foreground">
            <template v-for="(item, index) in crumbs" :key="item.id">
                <BreadcrumbItem class="min-w-0">
                    <BreadcrumbPage
                        v-if="index === 0 || (path[0]?.id === 'Trash' && index === 1)"
                        class="truncate text-content-header-foreground"
                    >
                        {{ item.name }}
                    </BreadcrumbPage>
                    <DropdownMenu v-else>
                        <DropdownMenuTrigger
                            :aria-label="`Navigate from ${item.name}`"
                            as="button"
                            :class="[
                                'min-w-0 truncate rounded-xs px-0.5 outline-none',
                                'text-content-header-foreground',
                                'hover:bg-hover',
                                'focus-visible:ring-1 focus-visible:ring-focus-ring',
                                'data-[state=open]:bg-hover',
                            ]"
                            :disabled="!item.items.some((node) => node.id !== currentNodeId)"
                            type="button"
                        >
                            {{ item.name }}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" class="max-w-72 overflow-hidden p-0">
                            <NodeBreadcrumbMenu
                                :current-node-id="currentNodeId"
                                :items="item.items"
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="index < crumbs.length - 1" />
            </template>
        </BreadcrumbList>
    </Breadcrumb>
</template>
