import { defineStore } from 'pinia';

import { useWorkspaceTabs } from '@/features/workspace-tabs';

export interface DocumentTab {
    id: string;
    kind: 'document';
    nodeId: string;
}

export const useWorkspaceStore = defineStore('workspace', () => {
    const { tabs, activeTab, openTab, closeTab, clearTabs } = useWorkspaceTabs<DocumentTab>();
    const activeDocumentId = computed(
        () => tabs.value.find((tab) => tab.id === activeTab.value)?.nodeId ?? null,
    );

    const openDocument = (nodeId: string) => {
        const existing = tabs.value.find((tab) => tab.nodeId === nodeId);
        openTab(existing ?? { id: `node:${nodeId}`, kind: 'document', nodeId });
    };

    return { tabs, activeTab, activeDocumentId, openDocument, closeTab, clearTabs };
});
