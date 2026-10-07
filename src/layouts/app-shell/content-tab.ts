import type { WorkspaceTab } from '@/features/workspace-tabs';
import type { NodePathItem } from '@/stores/nodes';
import type { Component } from 'vue';

export interface ContentTab extends WorkspaceTab {
    breadcrumbs: NodePathItem[];
    component: Component;
    props?: Record<string, unknown>;
}
