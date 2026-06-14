<script setup lang="ts">
import AppMenuBar from './AppMenuBar.vue';
import AppWindowControls from './AppWindowControls.vue';
</script>

<template>
    <div
        class="drag sticky z-50 grid h-(--title-bar-height) grid-cols-[1fr_auto_1fr] items-center border-b"
    >
        <div class="flex h-full items-center justify-self-start">
            <div
                class="size-(--title-bar-height) bg-[url(@/assets/images/icon.png)] bg-size-[20px] bg-center bg-no-repeat"
            ></div>
            <AppMenuBar class="drag-none" />
        </div>

        <div class="flex items-center justify-self-center">New world</div>

        <AppWindowControls class="drag-none justify-self-end" />
    </div>
</template>
