<template>
    <div
        id="app-status-bar"
        :class="[
            'sticky z-40 flex h-(--status-bar-height) shrink-0 items-center justify-end border-t px-2 text-xs',
            'border-status-bar-border bg-status-bar-background text-status-bar-foreground',
        ]"
    ></div>
</template>
