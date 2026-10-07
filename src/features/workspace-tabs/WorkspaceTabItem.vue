<script setup lang="ts">
import type { WorkspaceTab } from '.';

import { XIcon } from '@lucide/vue';

import { TooltipTrigger } from '@/components/ui/tooltip';

defineProps<{ tab: WorkspaceTab }>();

const tooltipOpen = ref(false);
const closeHovered = ref(false);

const emit = defineEmits<{
    close: [id: string];
}>();
</script>

<template>
    <Tooltip :open="tooltipOpen && !closeHovered" @update:open="tooltipOpen = $event">
        <TabsTrigger
            :as="TooltipTrigger"
            :class="[
                'group/tab relative h-full min-w-36 flex-none justify-start gap-2 rounded-t-md rounded-b-none border-0 border-r border-tabs-trigger-border px-3 pr-9 text-xs font-normal',
                'aria-selected:z-10 aria-selected:border-r-transparent aria-selected:shadow-none',

                // Concave bottom corners.
                `before:pointer-events-none before:absolute before:bottom-0 before:-left-1.5 before:hidden before:size-1.5 before:content-['']`,
                'before:bg-[radial-gradient(circle_at_top_left,transparent_6px,var(--color-tabs-trigger-selected)_6.5px)] aria-selected:before:block',
                `after:pointer-events-none after:absolute after:-right-1.5 after:bottom-0 after:hidden after:size-1.5 after:content-['']`,
                'after:bg-[radial-gradient(circle_at_top_right,transparent_6px,var(--color-tabs-trigger-selected)_6.5px)] aria-selected:after:block',
            ]"
            :value="tab.id"
        >
            <component
                :is="tab.icon"
                v-if="tab.icon"
                class="size-3.5 text-tabs-trigger-icon-foreground"
            />
            <span class="max-w-40 truncate">{{ tab.title }}</span>
            <Button
                :aria-label="`Close ${tab.title}`"
                :class="[
                    'invisible absolute top-1/2 right-2 z-20 size-5 -translate-y-1/2 text-tabs-close-foreground',
                    'hover:bg-tabs-close-hover hover:text-tabs-close-hover-foreground',
                    'group-focus-within/tab:visible group-hover/tab:visible group-aria-selected/tab:visible',
                ]"
                size="icon"
                type="button"
                variant="ghost"
                @click.stop="emit('close', tab.id)"
                @focus.stop
                @keydown.stop
                @mousedown.stop.prevent
                @pointerdown.stop
                @pointerenter="closeHovered = true"
                @pointerleave="closeHovered = false"
                @pointermove.stop
            >
                <XIcon class="size-3" />
            </Button>
        </TabsTrigger>

        <TooltipContent class="max-w-80 wrap-break-word" side="bottom">
            {{ tab.title }}
        </TooltipContent>
    </Tooltip>
</template>
