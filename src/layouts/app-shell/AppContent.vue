<script setup lang="ts">
import { Editor } from '@/features/editor';
import { NodeBreadcrumb } from '@/features/node-breadcrumb';
import { useNodeStore } from '@/stores/nodes';

const nodes = useNodeStore();
</script>

<template>
    <SidebarInset class="min-h-0 min-w-0 overflow-hidden">
        <header class="flex h-5 shrink-0 items-center border-b px-2">
            <NodeBreadcrumb />
        </header>
        <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
            <Editor v-if="nodes.openedNodeId" />
        </main>
    </SidebarInset>
</template>
