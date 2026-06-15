<script setup lang="ts">
import { getName, getVersion } from '@tauri-apps/api/app';
import { VisuallyHidden } from 'reka-ui';

import appIcon from '@/assets/images/icon.png';

const appName = ref('');
const appVersion = ref('');

onMounted(async () => {
    [appName.value, appVersion.value] = await Promise.all([getName(), getVersion()]);
});
</script>

<template>
    <DialogContent class="h-40 w-100" :show-close-button="false">
        <VisuallyHidden feature="fully-hidden">
            <DialogHeader>
                <DialogTitle>About</DialogTitle>
                <DialogDescription>About {{ appName }}</DialogDescription>
            </DialogHeader>
        </VisuallyHidden>

        <div class="flex items-center justify-center gap-4">
            <img :alt="appName" class="size-25 shrink-0" :src="appIcon" />

            <div class="flex flex-col items-center justify-center">
                <div class="font-title text-7xl">{{ appName }}</div>
                <div class="text-muted-foreground text-xs">v{{ appVersion }}</div>
            </div>
        </div>
    </DialogContent>
</template>
