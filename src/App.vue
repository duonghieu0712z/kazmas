<script setup lang="ts">
import { useEventListener } from '@vueuse/core';

import { AppShell } from '@/layouts/app-shell';
import { executeMenuCommand } from '@/menus';
import { ContextMenuProvider } from '@/providers/context-menu';
import { DialogProvider } from '@/providers/dialog';
import { ThemeProvider } from '@/providers/theme';
import { isMac } from '@/utils/platform';

if (!isMac()) {
    useEventListener(
        window,
        'keydown',
        async (event) => {
            if (
                event.ctrlKey &&
                !event.metaKey &&
                !event.altKey &&
                !event.shiftKey &&
                event.key.toLowerCase() === 'r'
            ) {
                event.preventDefault();
                await executeMenuCommand('reload-window');
            }
        },
        { capture: true },
    );
}
</script>

<template>
    <ThemeProvider>
        <AppShell />

        <ContextMenuProvider />
        <DialogProvider />
    </ThemeProvider>
</template>
