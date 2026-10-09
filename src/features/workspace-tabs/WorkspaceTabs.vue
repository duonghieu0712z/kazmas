<script setup lang="ts" generic="T extends WorkspaceTab">
import type { WorkspaceTab } from '.';

import { useEventListener, useResizeObserver } from '@vueuse/core';

import { useTabReorder } from './use-tab-reorder';
import WorkspaceTabItem from './WorkspaceTabItem.vue';

const props = defineProps<{ tabs: T[] }>();

const activeTab = defineModel<string>({ required: true });
const tabScrollArea = useTemplateRef<ComponentPublicInstance>('tabScrollArea');
const viewport = computed(() =>
    (tabScrollArea.value?.$el as HTMLElement | undefined)?.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
    ),
);
const tabList = computed(() => viewport.value?.querySelector<HTMLElement>('[role="tablist"]'));
const lastTabAtRightEdge = ref(false);
const emit = defineEmits<{
    close: [id: string];
    contextmenu: [event: MouseEvent, tab: T];
    move: [id: string, index: number];
}>();
const { draggedId, dragPosition, dropTarget } = useTabReorder({
    tabs: () => props.tabs,
    list: tabList,
    viewport,
    select: (id) => (activeTab.value = id),
    move: (id, index) => emit('move', id, index),
});
const draggedTab = computed(() => props.tabs.find((tab) => tab.id === draggedId.value));

defineSlots<{
    default: (props: { tab: T; active: boolean }) => any;
}>();

function revealSelectedTab() {
    const selectedTab = viewport.value?.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
    );

    if (!viewport.value || !selectedTab) {
        return;
    }

    const viewportRect = viewport.value.getBoundingClientRect();
    const tabRect = selectedTab.getBoundingClientRect();
    const offset =
        tabRect.left < viewportRect.left
            ? tabRect.left - viewportRect.left
            : Math.max(0, tabRect.right - viewportRect.right);

    if (offset !== 0) {
        viewport.value.scrollBy({ left: offset });
    }
    updateLastTabEdge();
}

function updateLastTabEdge() {
    const tabs = tabList.value?.querySelectorAll<HTMLElement>('[role="tab"]');
    const lastTab = tabs?.[tabs.length - 1];
    const viewportRect = viewport.value?.getBoundingClientRect();
    lastTabAtRightEdge.value = !!(
        lastTab &&
        viewportRect?.width &&
        lastTab.getBoundingClientRect().right >= viewportRect.right - 1
    );
}

function scrollTabs(event: WheelEvent) {
    const element = viewport.value;
    if (
        !element ||
        element.scrollWidth <= element.clientWidth ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.deltaX !== 0 ||
        event.deltaY === 0
    ) {
        return;
    }

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
    event.preventDefault();
    element.scrollBy({ left: event.deltaY * unit });
}

useEventListener(viewport, 'wheel', scrollTabs, { passive: false });
useEventListener(viewport, 'scroll', updateLastTabEdge);
useResizeObserver([viewport, tabList], updateLastTabEdge);
watch([activeTab, () => props.tabs], revealSelectedTab, { flush: 'post' });
onMounted(revealSelectedTab);
</script>

<template>
    <Tabs
        v-model="activeTab"
        class="h-full min-h-0 min-w-0 gap-0 overflow-hidden"
        :class="{
            'bg-tabs-empty-background': !tabs.length,
            'cursor-grabbing select-none **:cursor-grabbing': !!draggedId,
        }"
    >
        <ScrollArea
            v-if="tabs.length"
            ref="tabScrollArea"
            class="h-8 min-w-0 shrink-0 bg-tabs-list-background"
            orientation="horizontal"
            :scroll-hide-delay="300"
        >
            <TabsList
                aria-label="Workspace tabs"
                class="touch-none justify-start gap-0 rounded-none bg-transparent p-0 select-none"
                :class="{ 'cursor-grabbing': draggedId }"
                @click="revealSelectedTab"
            >
                <WorkspaceTabItem
                    v-for="(tab, index) in tabs"
                    :key="tab.id"
                    :dragged="draggedId === tab.id"
                    :drop-side="dropTarget?.id === tab.id ? dropTarget.side : undefined"
                    :hide-left-corner="index === 0"
                    :hide-right-corner="index === tabs.length - 1 && lastTabAtRightEdge"
                    :reordering="!!draggedId"
                    :tab="tab"
                    @close="emit('close', $event)"
                    @contextmenu="emit('contextmenu', $event, tab)"
                />
            </TabsList>
        </ScrollArea>

        <TabsContent
            v-for="tab in tabs"
            :key="tab.id"
            class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
            force-mount
            :value="tab.id"
        >
            <slot :active="activeTab === tab.id" :tab="tab" />
        </TabsContent>

        <Teleport to="body">
            <div
                v-if="draggedTab"
                aria-hidden="true"
                class="pointer-events-none fixed z-100 flex h-8 max-w-64 items-center gap-2 rounded-md bg-tabs-trigger-selected px-3 text-xs text-tabs-trigger-selected-foreground shadow-lg"
                data-slot="tab-drag-preview"
                :style="{ left: `${dragPosition.x + 12}px`, top: `${dragPosition.y + 12}px` }"
            >
                <component
                    :is="draggedTab.icon"
                    v-if="draggedTab.icon"
                    class="size-3.5 shrink-0 text-tabs-trigger-icon-foreground"
                />
                <span class="truncate">{{ draggedTab.title }}</span>
            </div>
        </Teleport>
    </Tabs>
</template>
