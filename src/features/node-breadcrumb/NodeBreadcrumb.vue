<script setup lang="ts">
import { useNodeStore } from '@/stores/nodes';

const nodes = useNodeStore();
</script>

<template>
    <Breadcrumb v-if="nodes.openedNodePath.length" class="min-w-0">
        <BreadcrumbList class="flex-nowrap text-xs">
            <template v-for="(item, index) in nodes.openedNodePath" :key="item.id">
                <BreadcrumbItem class="min-w-0">
                    <BreadcrumbPage class="truncate">{{ item.name }}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="index < nodes.openedNodePath.length - 1" />
            </template>
        </BreadcrumbList>
    </Breadcrumb>
</template>
