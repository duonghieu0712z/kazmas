<script setup lang="ts">
import { useColorMode } from '@vueuse/core';

import AppContent from './AppContent.vue';
import AppSidebar from './AppSidebar.vue';
import AppStatusBar from './AppStatusBar.vue';

const STATUS_BAR_HEIGHT = '1.5rem';

const { store } = useColorMode();
store.value = 'auto';
</script>

<template>
    <SidebarProvider class="flex flex-col" :style="{ '--status-bar-height': STATUS_BAR_HEIGHT }">
        <div class="flex flex-1">
            <AppSidebar />
            <AppContent />
        </div>

        <AppStatusBar />
    </SidebarProvider>
</template>
