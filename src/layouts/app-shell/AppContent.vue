<script setup lang="ts">
import { Editor } from '@/features/editor';

const content = '<p>Hello world</p>';
</script>

<template>
    <SidebarInset>
        <header class="flex h-5 items-center border-b px-2 text-xs">Header</header>
        <main class="flex-1 overflow-auto">
            <Editor :content="content" />
        </main>
    </SidebarInset>
</template>
