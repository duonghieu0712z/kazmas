<script setup lang="ts">
import AppActivityBar from './AppActivityBar.vue';
</script>

<template>
    <Sidebar
        :class="[
            'top-(--title-bar-height) bottom-(--status-bar-height) h-[calc(100svh-var(--title-bar-height)-var(--status-bar-height))]',
            'overflow-hidden *:data-[sidebar=sidebar]:flex-row',
        ]"
        collapsible="icon"
    >
        <AppActivityBar />

        <Sidebar class="hidden flex-1 items-center justify-center md:flex" collapsible="none">
            Sidebar
        </Sidebar>
    </Sidebar>
</template>
