<script setup lang="ts">
import AppContent from './AppContent.vue';
import AppSidebar from './AppSidebar.vue';
import AppStatusBar from './AppStatusBar.vue';

const STATUS_BAR_HEIGHT = '1.5rem';
</script>

<template>
    <div :style="{ '--status-bar-height': STATUS_BAR_HEIGHT }">
        <SidebarProvider class="flex flex-col">
            <div class="flex flex-1">
                <AppSidebar />
                <AppContent />
            </div>

            <AppStatusBar />
        </SidebarProvider>
    </div>
</template>
