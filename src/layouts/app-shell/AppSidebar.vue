<script setup lang="ts">
import type { ActivityBarItemName } from './AppActivityBar.vue';

import { useSessionStorage } from '@vueuse/core';

import { useSidebar } from '@/components/ui/sidebar';
import { NodeTreeSidebar } from '@/features/node-tree';
import { useNodeStore } from '@/stores/nodes';

import AppActivityBar from './AppActivityBar.vue';

const activeActivity = useSessionStorage<ActivityBarItemName | null>('node_view_activity', null);

const nodes = useNodeStore();
const { open } = useSidebar();

watch(
    () => nodes.treeRequest,
    (request) => {
        if (!request) {
            return;
        }
        const section =
            request.action === 'create'
                ? request.section
                : nodes.getNodePath(request.nodeId)[0]?.id;
        if (section === 'Manuscript' || section === 'Wiki') {
            activeActivity.value = section;
            open.value = true;
        }
    },
);
</script>

<template>
    <Sidebar class="min-h-0 w-full flex-row overflow-hidden" collapsible="none">
        <AppActivityBar v-model="activeActivity" class="shrink-0" />

        <Sidebar v-show="open" class="min-h-0 min-w-0 flex-1 overflow-hidden" collapsible="none">
            <NodeTreeSidebar
                :active="activeActivity === 'Manuscript'"
                section="Manuscript"
                :tree="nodes.manuscripts"
            />
            <NodeTreeSidebar
                :active="activeActivity === 'Wiki'"
                section="Wiki"
                :tree="nodes.wikis"
            />
        </Sidebar>
    </Sidebar>
</template>
