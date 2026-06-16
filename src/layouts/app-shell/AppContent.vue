<script setup lang="ts">
import { openSaveWorldDialog, openWindowPlacementDialog } from '@/dialogs';
</script>

<template>
    <SidebarInset>
        <header class="flex h-5 items-center border-b px-2 text-xs">Header</header>
        <div class="flex flex-1 items-center justify-center gap-2">
            <Button @click="openSaveWorldDialog('Test World')">Save World Dialog</Button>
            <Button variant="secondary" @click="openWindowPlacementDialog">
                Window Placement Dialog
            </Button>
        </div>
    </SidebarInset>
</template>
