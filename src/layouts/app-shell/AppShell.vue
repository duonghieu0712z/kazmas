<script setup lang="ts">
import { TITLE_BAR_HEIGHT } from '@/generated/bindings';

import AppStatusBar from './AppStatusBar.vue';
import AppTitleBar from './AppTitleBar.vue';
import AppWorkspace from './AppWorkspace.vue';

const STATUS_BAR_HEIGHT = '1.5rem';
</script>

<template>
    <SidebarProvider
        class="flex h-full min-h-0 flex-col overflow-hidden"
        :style="{
            '--title-bar-height': `${TITLE_BAR_HEIGHT}px`,
            '--status-bar-height': STATUS_BAR_HEIGHT,
        }"
    >
        <AppTitleBar />
        <AppWorkspace />
        <AppStatusBar />
    </SidebarProvider>
</template>
