<script setup lang="ts">
import type { ActivityBarItemName } from './AppActivityBar.vue';

import { NodeTreeView } from '@/features/node-tree';
import { useNodeStore } from '@/stores/nodes';

import AppActivityBar from './AppActivityBar.vue';

const activeActivity = ref<ActivityBarItemName | null>(null);
const nodes = useNodeStore();
</script>

<template>
    <Sidebar
        :class="[
            'top-(--title-bar-height) bottom-(--status-bar-height) h-[calc(100svh-var(--title-bar-height)-var(--status-bar-height))]',
            'overflow-hidden *:data-[sidebar=sidebar]:flex-row',
        ]"
        collapsible="icon"
    >
        <AppActivityBar v-model="activeActivity" />

        <Sidebar class="hidden min-w-0 flex-1 overflow-hidden md:flex" collapsible="none">
            <NodeTreeView v-if="activeActivity === 'Manuscript'" :tree="nodes.manuscripts" />
            <NodeTreeView v-else-if="activeActivity === 'Wiki'" :tree="nodes.wikis" />
        </Sidebar>
    </Sidebar>
</template>
