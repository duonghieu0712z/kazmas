<script setup lang="ts">
import type { ContentTab } from './content-tab';

import { storeToRefs } from 'pinia';

import { Editor } from '@/features/editor';
import { NodeBreadcrumb } from '@/features/node-breadcrumb';
import { WorkspaceTabs } from '@/features/workspace-tabs';
import { getNodeIcon } from '@/lib/node-icons';
import { useNodeStore } from '@/stores/nodes';
import { useWorkspaceStore } from '@/stores/workspace';

interface TabContent {
    prepareClose?: () => Promise<boolean>;
}

const nodes = useNodeStore();
const workspace = useWorkspaceStore();
const { activeTab } = storeToRefs(workspace);
const tabContents = new Map<string, TabContent>();
const closingTabs = new Set<string>();

const tabs = computed<ContentTab[]>(() =>
    workspace.tabs.map((tab) => {
        const node = nodes.getNode(tab.nodeId);
        return {
            id: tab.id,
            title: node?.name ?? 'Untitled',
            icon: getNodeIcon(node?.kind),
            breadcrumbs: nodes.getNodePath(tab.nodeId),
            component: Editor,
            props: {
                nodeId: tab.nodeId,
                'onError:save': () => {
                    if (workspace.tabs.includes(tab)) {
                        workspace.activeTab = tab.id;
                    }
                },
            },
        };
    }),
);

function setTabContent(id: string, instance: Element | ComponentPublicInstance | null) {
    if (instance) {
        tabContents.set(id, instance as TabContent);
    } else {
        tabContents.delete(id);
    }
}

async function closeTab(id: string) {
    const tab = workspace.tabs.find((item) => item.id === id);
    if (!tab || closingTabs.has(id)) {
        return;
    }

    closingTabs.add(id);
    try {
        const content = tabContents.get(id);
        if (content?.prepareClose && !(await content.prepareClose())) {
            if (workspace.tabs.includes(tab)) {
                workspace.activeTab = id;
            }
            return;
        }
        if (workspace.tabs.includes(tab)) {
            workspace.closeTab(id);
        }
    } finally {
        closingTabs.delete(id);
    }
}
</script>

<template>
    <SidebarInset class="h-full min-h-0 min-w-0 overflow-hidden">
        <WorkspaceTabs v-model="activeTab" :tabs="tabs" @close="closeTab" @move="workspace.moveTab">
            <template #default="{ tab, active }">
                <header
                    v-if="tab.breadcrumbs.length"
                    class="relative z-40 flex h-5 shrink-0 items-center border-b border-content-header-border bg-content-header-background px-2 text-content-header-foreground"
                >
                    <NodeBreadcrumb :path="tab.breadcrumbs" />
                </header>

                <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
                    <component
                        :is="tab.component"
                        :ref="
                            (instance: Element | ComponentPublicInstance | null) =>
                                setTabContent(tab.id, instance)
                        "
                        v-bind="tab.props"
                        :active="active"
                    />
                </main>
            </template>
        </WorkspaceTabs>
    </SidebarInset>
</template>
