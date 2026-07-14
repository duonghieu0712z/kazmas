<script setup lang="ts">
import { Editor } from '@/features/editor';
</script>

<template>
    <SidebarInset class="min-h-0 min-w-0 overflow-hidden">
        <header class="flex h-5 shrink-0 items-center border-b px-2 text-xs">Header</header>
        <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
            <Editor />
        </main>
    </SidebarInset>
</template>
