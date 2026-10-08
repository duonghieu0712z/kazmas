<script setup lang="ts">
import type { ContentTab } from './content-tab';

import { storeToRefs } from 'pinia';

import { Editor } from '@/features/editor';
import { NodeBreadcrumb } from '@/features/node-breadcrumb';
import { createWorkspaceTabMenuItems, WorkspaceTabs } from '@/features/workspace-tabs';
import { getNodeIcon } from '@/lib/node-icons';
import { useContextMenuProvider } from '@/providers/context-menu';
import { useNodeStore } from '@/stores/nodes';
import { useWorkspaceStore } from '@/stores/workspace';
import { useWorldStore } from '@/stores/world';

interface TabContent {
    prepareClose?: () => Promise<boolean>;
}

const nodes = useNodeStore();
const workspace = useWorkspaceStore();
const world = useWorldStore();
const { openContextMenu } = useContextMenuProvider();
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

function showTabContextMenu(event: MouseEvent, tab: ContentTab) {
    const target = workspace.tabs.find((item) => item.id === tab.id);
    const worldId = world.manifest?.id;
    if (!target) {
        return;
    }
    openContextMenu({
        event,
        items: () =>
            createWorkspaceTabMenuItems(tabs.value, tab.id, !!nodes.getNode(target.nodeId), {
                close: async (ids) => {
                    if (world.manifest?.id === worldId && workspace.tabs.includes(target)) {
                        await closeTabs(ids);
                    }
                },
                reveal: () => {
                    if (world.manifest?.id === worldId && workspace.tabs.includes(target)) {
                        nodes.revealInTree(target.nodeId);
                    }
                },
            }),
    });
}

function setTabContent(id: string, instance: Element | ComponentPublicInstance | null) {
    if (instance) {
        tabContents.set(id, instance as TabContent);
    } else {
        tabContents.delete(id);
    }
}

async function closeTab(id: string): Promise<boolean> {
    const tab = workspace.tabs.find((item) => item.id === id);
    if (!tab) {
        return true;
    }
    if (closingTabs.has(id)) {
        return false;
    }

    closingTabs.add(id);
    try {
        const content = tabContents.get(id);
        if (content?.prepareClose && !(await content.prepareClose())) {
            if (workspace.tabs.includes(tab)) {
                workspace.activeTab = id;
            }
            return false;
        }
        if (workspace.tabs.includes(tab)) {
            workspace.closeTab(id);
        }
        return true;
    } finally {
        closingTabs.delete(id);
    }
}

async function closeTabs(ids: readonly string[]) {
    const worldId = world.manifest?.id;
    const targets = workspace.tabs.filter((tab) => ids.includes(tab.id));
    for (const tab of targets) {
        if (world.manifest?.id !== worldId) {
            return;
        }
        if (workspace.tabs.includes(tab) && !(await closeTab(tab.id))) {
            return;
        }
    }
}
</script>

<template>
    <SidebarInset class="h-full min-h-0 min-w-0 overflow-hidden">
        <WorkspaceTabs
            v-model="activeTab"
            :tabs="tabs"
            @close="closeTab"
            @contextmenu="showTabContextMenu"
            @move="workspace.moveTab"
        >
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
