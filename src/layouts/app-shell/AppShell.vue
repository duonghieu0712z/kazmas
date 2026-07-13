<script setup lang="ts">
import { useColorMode } from '@vueuse/core';

import AppContent from './AppContent.vue';
import AppSidebar from './AppSidebar.vue';
import AppStatusBar from './AppStatusBar.vue';
import AppTitleBar from './AppTitleBar.vue';

const TITLE_BAR_HEIGHT = '2rem';
const STATUS_BAR_HEIGHT = '1.5rem';

useColorMode({ initialValue: 'auto' });
</script>

<template>
    <SidebarProvider
        class="flex h-full min-h-0 flex-col overflow-hidden"
        :style="{
            '--title-bar-height': TITLE_BAR_HEIGHT,
            '--status-bar-height': STATUS_BAR_HEIGHT,
        }"
    >
        <AppTitleBar />

        <div class="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <AppSidebar />
            <AppContent />
        </div>

        <AppStatusBar />
    </SidebarProvider>
</template>
