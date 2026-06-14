<script setup lang="ts">
import { CopyIcon, MinusIcon, SquareIcon, XIcon } from '@lucide/vue';
import { getCurrentWindow } from '@tauri-apps/api/window';

const window = getCurrentWindow();

const isMaximized = ref(false);

async function minimizeWindow() {
    await window.minimize();
}

async function toggleMaximizeWindow() {
    await window.toggleMaximize();
    isMaximized.value = await window.isMaximized();
}

async function closeWindow() {
    await window.close();
}

onMounted(async () => {
    isMaximized.value = await window.isMaximized();
});
</script>

<template>
    <div class="flex">
        <Button
            class="[&_svg]:stroke-muted-foreground active:[&_svg]:stroke-foreground focus:[&_svg]:stroke-foreground hover:[&_svg]:stroke-foreground rounded-none"
            size="icon"
            variant="ghost"
            @click.stop.prevent="minimizeWindow"
        >
            <MinusIcon />
        </Button>
        <Button
            class="[&_svg]:stroke-muted-foreground active:[&_svg]:stroke-foreground focus:[&_svg]:stroke-foreground hover:[&_svg]:stroke-foreground rounded-none"
            size="icon"
            variant="ghost"
            @click.prevent="toggleMaximizeWindow"
        >
            <CopyIcon v-if="isMaximized" class="size-3 -scale-x-100" />
            <SquareIcon v-else class="size-3" />
        </Button>
        <Button
            :class="[
                'hover:bg-destructive/90 dark:hover:bg-destructive/90 rounded-none',
                '[&_svg]:stroke-muted-foreground active:[&_svg]:stroke-foreground focus:[&_svg]:stroke-foreground hover:[&_svg]:stroke-foreground',
            ]"
            size="icon"
            variant="ghost"
            @click.prevent="closeWindow"
        >
            <XIcon />
        </Button>
    </div>
</template>
