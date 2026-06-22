<script setup lang="ts">
import { getName, getVersion } from '@tauri-apps/api/app';
import { VisuallyHidden } from 'reka-ui';

const appName = ref('');
const appVersion = ref('');

onMounted(async () => {
    [appName.value, appVersion.value] = await Promise.all([getName(), getVersion()]);
});
</script>

<template>
    <DialogContent class="h-40 w-100 items-center justify-center p-0" :show-close-button="false">
        <VisuallyHidden feature="fully-hidden">
            <DialogHeader>
                <DialogTitle>About</DialogTitle>
                <DialogDescription>About {{ appName }}</DialogDescription>
            </DialogHeader>
        </VisuallyHidden>

        <div class="flex items-center justify-center overflow-hidden">
            <div
                class="size-25 bg-[url(@/assets/images/icon.png)] bg-size-[100px] bg-center bg-no-repeat"
            ></div>

            <div class="relative flex flex-col items-center justify-center overflow-visible">
                <div
                    :class="[
                        'font-title text-7xl underline decoration-2 underline-offset-3',
                        'bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text pr-1.5 pl-4 text-transparent',
                    ]"
                >
                    {{ appName }}
                </div>
                <div class="text-muted-foreground absolute right-0 bottom-0 pr-1.5 text-[10px]">
                    v{{ appVersion }}
                </div>
            </div>
        </div>
    </DialogContent>
</template>
