<script setup lang="ts">
import AppStatusBar from './AppStatusBar.vue';
import AppTitleBar from './AppTitleBar.vue';
import AppWorkspace from './AppWorkspace.vue';

const TITLE_BAR_HEIGHT = '2rem';
const STATUS_BAR_HEIGHT = '1.5rem';
</script>

<template>
    <SidebarProvider
        class="h-full min-h-0 flex-col overflow-hidden"
        :style="{
            '--title-bar-height': TITLE_BAR_HEIGHT,
            '--status-bar-height': STATUS_BAR_HEIGHT,
        }"
    >
        <AppTitleBar />
        <AppWorkspace />
        <AppStatusBar />
    </SidebarProvider>
</template>
