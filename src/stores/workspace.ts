import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';

import { useWorkspaceTabs } from '@/features/workspace-tabs';

export interface DocumentTab {
    id: string;
    kind: 'document';
    nodeId: string;
}

interface WorkspaceSession {
    nodeIds: string[];
    activeTab: string;
    recentTabIds: string[];
}

export const useWorkspaceStore = defineStore('workspace', () => {
    const { tabs, activeTab, recentTabIds, openTab, closeTab, clearTabs, restoreTabs } =
        useWorkspaceTabs<DocumentTab>();
    const sessions = useLocalStorage<Record<string, WorkspaceSession>>(
        'workspace_tabs',
        {},
        {
            flush: 'sync',
            listenToStorageChanges: false,
        },
    );
    let currentWorldId: string | null = null;

    watch(
        [tabs, activeTab, recentTabIds],
        () => {
            if (currentWorldId) {
                sessions.value = {
                    ...sessions.value,
                    [currentWorldId]: {
                        nodeIds: tabs.value.map((tab) => tab.nodeId),
                        activeTab: activeTab.value,
                        recentTabIds: [...recentTabIds.value],
                    },
                };
            }
        },
        { flush: 'sync' },
    );

    const resetWorld = () => {
        currentWorldId = null;
        clearTabs();
    };

    const restoreWorld = (worldId: string, isDocument: (nodeId: string) => boolean) => {
        const saved = sessions.value[worldId];
        const nodeIds = [...new Set(saved?.nodeIds ?? [])].filter(isDocument);
        currentWorldId = null;
        restoreTabs(
            nodeIds.map((nodeId) => ({ id: `node:${nodeId}`, kind: 'document', nodeId })),
            saved?.activeTab ?? '',
            saved?.recentTabIds ?? [],
        );
        currentWorldId = worldId;
    };
    const activeDocumentId = computed(
        () => tabs.value.find((tab) => tab.id === activeTab.value)?.nodeId ?? null,
    );

    const openDocument = (nodeId: string) => {
        const existing = tabs.value.find((tab) => tab.nodeId === nodeId);
        openTab(existing ?? { id: `node:${nodeId}`, kind: 'document', nodeId });
    };

    return {
        tabs,
        activeTab,
        activeDocumentId,
        openDocument,
        closeTab,
        clearTabs,
        resetWorld,
        restoreWorld,
    };
});
