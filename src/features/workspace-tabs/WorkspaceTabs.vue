<script setup lang="ts" generic="T extends WorkspaceTab">
import type { WorkspaceTab } from '.';

import { useEventListener, useResizeObserver } from '@vueuse/core';

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
}>();

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
        :class="{ 'bg-tabs-empty-background': !tabs.length }"
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
                class="justify-start gap-0 rounded-none bg-transparent p-0"
                @click="revealSelectedTab"
            >
                <WorkspaceTabItem
                    v-for="(tab, index) in tabs"
                    :key="tab.id"
                    :hide-left-corner="index === 0"
                    :hide-right-corner="index === tabs.length - 1 && lastTabAtRightEdge"
                    :tab="tab"
                    @close="emit('close', $event)"
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
    </Tabs>
</template>
