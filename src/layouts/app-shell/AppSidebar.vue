<script setup lang="ts">
import type { ActivityBarItemName } from './AppActivityBar.vue';

import { useSidebar } from '@/components/ui/sidebar';
import { NodeTreeView } from '@/features/node-tree';
import { useNodeStore } from '@/stores/nodes';

import AppActivityBar from './AppActivityBar.vue';

const activeActivity = ref<ActivityBarItemName | null>(null);
const nodes = useNodeStore();
const { open } = useSidebar();
</script>

<template>
    <Sidebar class="min-h-0 w-full flex-row overflow-hidden" collapsible="none">
        <AppActivityBar v-model="activeActivity" class="shrink-0" />

        <Sidebar v-show="open" class="min-h-0 min-w-0 flex-1 overflow-hidden" collapsible="none">
            <NodeTreeView v-if="activeActivity === 'Manuscript'" :tree="nodes.manuscripts" />
            <NodeTreeView v-else-if="activeActivity === 'Wiki'" :tree="nodes.wikis" />
        </Sidebar>
    </Sidebar>
</template>
