<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { PanelLeftIcon } from '@lucide/vue';

import { Button } from '@/components/ui/button';

import { useSidebar } from './utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
    <Button
        :class="props.class"
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        size="icon"
        variant="ghost"
        @click="toggleSidebar"
    >
        <PanelLeftIcon />
        <span class="sr-only">Toggle Sidebar</span>
    </Button>
</template>
