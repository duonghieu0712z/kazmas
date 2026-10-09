<script setup lang="ts">
import type { WorkspaceTab } from '.';

import { XIcon } from '@lucide/vue';

import { TooltipTrigger } from '@/components/ui/tooltip';

defineProps<{
    tab: WorkspaceTab;
    hideLeftCorner?: boolean;
    hideRightCorner?: boolean;
    dragged?: boolean;
    reordering?: boolean;
    dropSide?: 'before' | 'after';
}>();

const tooltipOpen = ref(false);
const closeHovered = ref(false);

const emit = defineEmits<{
    close: [id: string];
    contextmenu: [event: MouseEvent];
}>();
</script>

<template>
    <Tooltip
        :open="tooltipOpen && !closeHovered && !reordering"
        @update:open="tooltipOpen = $event"
    >
        <TooltipTrigger class="relative flex h-full flex-none">
            <TabsTrigger
                as="div"
                :class="[
                    'group/tab relative h-full min-w-36 flex-none justify-start gap-2 rounded-t-md rounded-b-none border-0 border-r border-tabs-trigger-border px-3 pr-9 text-xs font-normal',
                    'aria-selected:z-10 aria-selected:border-r-transparent aria-selected:shadow-none',
                    dragged && 'text-muted-foreground!',

                    // Concave bottom corners.
                    `before:pointer-events-none before:absolute before:bottom-0 before:-left-1.5 before:hidden before:size-1.5 before:content-['']`,
                    'before:bg-[radial-gradient(circle_at_top_left,transparent_6px,var(--color-tabs-trigger-selected)_6.5px)]',
                    !hideLeftCorner && 'aria-selected:before:block',
                    `after:pointer-events-none after:absolute after:-right-1.5 after:bottom-0 after:hidden after:size-1.5 after:content-['']`,
                    'after:bg-[radial-gradient(circle_at_top_right,transparent_6px,var(--color-tabs-trigger-selected)_6.5px)]',
                    !hideRightCorner && 'aria-selected:after:block',
                ]"
                :data-tab-id="tab.id"
                :value="tab.id"
                @contextmenu="emit('contextmenu', $event)"
                @mousedown.right.prevent
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
            <span
                v-if="dropSide"
                aria-hidden="true"
                class="pointer-events-none absolute inset-y-0 z-30 w-0.5 bg-focus-ring"
                :class="dropSide === 'before' ? 'left-0' : 'right-0'"
            />
        </TooltipTrigger>

        <TooltipContent class="max-w-80 wrap-break-word" side="bottom">
            {{ tab.title }}
        </TooltipContent>
    </Tooltip>
</template>
