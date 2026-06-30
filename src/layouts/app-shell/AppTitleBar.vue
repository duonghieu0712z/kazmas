<script setup lang="ts">
import { CircleSmallIcon } from '@lucide/vue';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { useWorldStore } from '@/stores/world';
import { isMac } from '@/utils/platform';

import AppMenuBar from './AppMenuBar.vue';
import AppWindowControls from './AppWindowControls.vue';

const mac = isMac();
const window = getCurrentWindow();

const world = useWorldStore();

const title = ref('');

onMounted(async () => {
    title.value = await window.title();
});
</script>

<template>
    <div
        class="sticky z-50 grid h-(--title-bar-height) grid-cols-[1fr_auto_1fr] items-center border-b"
        data-tauri-drag-region="deep"
    >
        <div v-if="!mac" class="flex h-full items-center justify-self-start">
            <div
                class="size-(--title-bar-height) bg-[url(@/assets/images/icon.png)] bg-size-[20px] bg-center bg-no-repeat"
            ></div>
            <AppMenuBar />
        </div>

        <div class="col-start-2 flex items-center gap-1 justify-self-center">
            <span>{{ title }}</span>
            <CircleSmallIcon
                v-if="world.isDirty"
                class="size-3 fill-current"
                title="Unsaved changes"
            />
        </div>

        <AppWindowControls v-if="!mac" class="justify-self-end" />
    </div>
</template>
