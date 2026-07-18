<script setup lang="ts">
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

withDefaults(
    defineProps<{
        showTooltip?: boolean;
        showShortcut?: boolean;
        shortcutKeys?: string[];
    }>(),
    {
        showTooltip: true,
        showShortcut: false,
    },
);
</script>

<template>
    <Tooltip v-if="showTooltip">
        <TooltipTrigger>
            <slot />
        </TooltipTrigger>

        <TooltipContent class="flex items-center gap-2" side="bottom">
            <slot name="tooltip" />
            <KbdGroup v-if="showShortcut && shortcutKeys">
                <Kbd v-for="key in shortcutKeys" :key="key">{{ key }}</Kbd>
            </KbdGroup>
        </TooltipContent>
    </Tooltip>

    <slot v-else />
</template>
