<script setup lang="ts">
import type { ContentTab } from './content-tab';

import { FileTextIcon, PlusIcon } from '@lucide/vue';

import { Editor } from '@/features/editor';
import { useWorkspaceTabs, WorkspaceTabs } from '@/features/workspace-tabs';
import { useNodeStore } from '@/stores/nodes';

import { createPreviewTab, createPreviewTabs } from './content-preview';

const nodes = useNodeStore();
const { tabs, activeTab, openTab, closeTab } = useWorkspaceTabs<ContentTab>(createPreviewTabs());
let nextPreviewTab = tabs.value.length + 1;

function openPreviewTab() {
    openTab(createPreviewTab(nextPreviewTab));
    nextPreviewTab += 1;
}

watch(
    () => nodes.openedNodeId,
    (nodeId) => {
        if (!nodeId) {
            for (const tab of tabs.value) {
                if (tab.id.startsWith('node:')) {
                    closeTab(tab.id);
                }
            }
            return;
        }

        openTab({
            id: `node:${nodeId}`,
            title: nodes.openedNodePath.at(-1)?.name ?? 'Untitled',
            icon: FileTextIcon,
            breadcrumbs: nodes.openedNodePath,
            component: Editor,
            props: { nodeId },
        });
    },
    { immediate: true },
);
</script>

<template>
    <SidebarInset class="h-full min-h-0 min-w-0 overflow-hidden">
        <WorkspaceTabs v-model="activeTab" :tabs="tabs" @close="closeTab">
            <template #default="{ tab }">
                <header
                    v-if="tab.breadcrumbs.length"
                    class="relative z-40 flex h-5 shrink-0 items-center border-b border-content-header-border bg-content-header-background px-2 text-content-header-foreground"
                >
                    <Breadcrumb class="min-w-0">
                        <BreadcrumbList
                            class="flex-nowrap text-xs text-content-header-muted-foreground"
                        >
                            <template v-for="(item, index) in tab.breadcrumbs" :key="item.id">
                                <BreadcrumbItem class="min-w-0">
                                    <BreadcrumbPage class="truncate text-content-header-foreground">
                                        {{ item.name }}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator v-if="index < tab.breadcrumbs.length - 1" />
                            </template>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
                    <component :is="tab.component" v-bind="tab.props" />
                </main>
            </template>
        </WorkspaceTabs>
        <Teleport defer to="#app-title-bar-actions">
            <Button
                aria-label="Open tab"
                class="size-6 text-muted-foreground"
                size="icon"
                title="Open sample tab"
                type="button"
                variant="ghost"
                @click="openPreviewTab"
            >
                <PlusIcon class="size-4" />
            </Button>
        </Teleport>
    </SidebarInset>
</template>
