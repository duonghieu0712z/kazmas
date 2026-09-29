<script setup lang="ts">
import { AppShell } from '@/layouts/app-shell';
import { DialogProvider } from '@/providers/dialog';
import { ThemeProvider } from '@/providers/theme';
</script>

<template>
    <ThemeProvider>
        <AppShell />
        <DialogProvider />
    </ThemeProvider>
</template>
