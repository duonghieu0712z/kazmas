<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

import { sidebarRailVariants } from '.';
import { useSidebar, useSidebarLayout } from './utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();

const { state, toggleSidebar } = useSidebar();
const layout = useSidebarLayout(null);
</script>

<template>
    <button
        aria-label="Toggle Sidebar"
        :class="
            cn(
                sidebarRailVariants({
                    side: layout?.side.value,
                    collapsible: layout?.collapsible.value,
                    state,
                }),
                props.class,
            )
        "
        data-sidebar="rail"
        data-slot="sidebar-rail"
        :tabindex="-1"
        title="Toggle Sidebar"
        @click="toggleSidebar"
    >
        <slot />
    </button>
</template>
