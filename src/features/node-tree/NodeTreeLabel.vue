<script setup lang="ts">
defineProps<{ name: string }>();
</script>

<template>
    <Tooltip>
        <TooltipTrigger as="span" class="min-w-0 flex-1 truncate">{{ name }}</TooltipTrigger>
        <TooltipContent class="max-w-80 wrap-break-word" side="right">{{ name }}</TooltipContent>
    </Tooltip>
</template>
