<script setup lang="ts" generic="T extends WorkspaceTab">
import type { WorkspaceTab } from '.';

import WorkspaceTabItem from './WorkspaceTabItem.vue';

const props = defineProps<{ tabs: T[] }>();

const activeTab = defineModel<string>({ required: true });
const tabScrollArea = useTemplateRef<ComponentPublicInstance>('tabScrollArea');
const emit = defineEmits<{
    close: [id: string];
}>();

defineSlots<{
    default: (props: { tab: T }) => any;
}>();

function revealSelectedTab() {
    const root = tabScrollArea.value?.$el as HTMLElement | undefined;
    const viewport = root?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    const selectedTab = viewport?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');

    if (!viewport || !selectedTab) {
        return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const tabRect = selectedTab.getBoundingClientRect();
    const offset =
        tabRect.left < viewportRect.left
            ? tabRect.left - viewportRect.left
            : Math.max(0, tabRect.right - viewportRect.right);

    if (offset !== 0) {
        viewport.scrollBy({ left: offset });
    }
}

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
        >
            <TabsList
                aria-label="Workspace tabs"
                class="justify-start gap-0 rounded-none bg-transparent p-0"
                @click="revealSelectedTab"
            >
                <WorkspaceTabItem
                    v-for="tab in tabs"
                    :key="tab.id"
                    :tab="tab"
                    @close="emit('close', $event)"
                />
            </TabsList>
        </ScrollArea>

        <TabsContent
            v-for="tab in tabs"
            :key="tab.id"
            class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
            :value="tab.id"
        >
            <slot :tab="tab" />
        </TabsContent>
    </Tabs>
</template>
