import type { Component } from 'vue';

export { default as WorkspaceTabs } from './WorkspaceTabs.vue';
export { useWorkspaceTabs } from './use-workspace-tabs';
export { createWorkspaceTabMenuItems } from './workspace-tab-menu';

export interface WorkspaceTab {
    id: string;
    title: string;
    icon?: Component;
}
