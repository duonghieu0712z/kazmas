<script setup lang="ts">
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

withDefaults(
    defineProps<{
        showTooltip?: boolean;
        shortcutKeys?: string[];
    }>(),
    {
        showTooltip: true,
    },
);
</script>

<template>
    <Tooltip v-if="showTooltip">
        <TooltipTrigger>
            <slot />
        </TooltipTrigger>

        <TooltipContent>
            <slot name="tooltip" />
            <KbdGroup v-if="shortcutKeys">
                <Kbd v-for="key in shortcutKeys" :key="key">{{ key }}</Kbd>
            </KbdGroup>
        </TooltipContent>
    </Tooltip>

    <slot v-else />
</template>
