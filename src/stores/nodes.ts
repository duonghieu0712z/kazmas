import type { NodeDto } from '@/generated/bindings';

import { defineStore } from 'pinia';

import { commands } from '@/generated/bindings';

export type NodeTreeDto = NodeDto & {
    children: NodeTreeDto[];
};

export type NodePathItem = {
    id: string;
    name: string;
};

export const useNodeStore = defineStore('nodes', () => {
    const manuscriptNodes = shallowRef<NodeDto[]>([]);
    const wikiNodes = shallowRef<NodeDto[]>([]);
    const selectedNodeId = shallowRef<string | null>(null);
    const openedNodeId = shallowRef<string | null>(null);
    let revision = 0;

    const manuscripts = computed(() => buildNodeTree(manuscriptNodes.value));
    const wikis = computed(() => buildNodeTree(wikiNodes.value));
    const openedNodePath = computed(() => {
        if (!openedNodeId.value) {
            return [];
        }

        return (
            buildNodePath('Manuscript', manuscriptNodes.value, openedNodeId.value) ??
            buildNodePath('Wiki', wikiNodes.value, openedNodeId.value) ??
            []
        );
    });

    const clearNodes = () => {
        revision += 1;
        manuscriptNodes.value = [];
        wikiNodes.value = [];
        selectedNodeId.value = null;
        openedNodeId.value = null;
    };

    const selectNode = (node: NodeDto) => {
        selectedNodeId.value = node.id;
    };

    const openNode = (node: NodeDto) => {
        if (node.kind === 'manuscript_entry' || node.kind === 'wiki_entry') {
            openedNodeId.value = node.id;
        }
    };

    const loadManuscripts = async () => {
        const currentRevision = revision;
        const result = await commands.getManuscripts();
        if (currentRevision === revision && result.status === 'ok') {
            manuscriptNodes.value = result.data ?? [];
            return manuscriptNodes.value;
        }
        return false;
    };

    const loadWikis = async () => {
        const currentRevision = revision;
        const result = await commands.getWikis();
        if (currentRevision === revision && result.status === 'ok') {
            wikiNodes.value = result.data ?? [];
            return wikiNodes.value;
        }
        return false;
    };

    const reloadNodes = async () => {
        revision += 1;
        await Promise.all([loadManuscripts(), loadWikis()]);
    };

    return {
        manuscripts,
        wikis,
        selectedNodeId,
        openedNodeId,
        openedNodePath,
        clearNodes,
        selectNode,
        openNode,
        loadManuscripts,
        loadWikis,
        reloadNodes,
    };
});

function buildNodeTree(nodes: NodeDto[]) {
    const nodeMap = new Map<string, NodeTreeDto>();
    for (const node of nodes) {
        nodeMap.set(node.id, { ...node, children: [] });
    }

    const roots: NodeTreeDto[] = [];
    for (const node of nodeMap.values()) {
        const parent = node.parentId ? nodeMap.get(node.parentId) : null;
        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

function buildNodePath(rootName: string, nodes: NodeDto[], nodeId: string) {
    const nodeMap = new Map<string, NodeDto>();
    for (const node of nodes) {
        nodeMap.set(node.id, node);
    }

    const path: NodePathItem[] = [];
    const visited = new Set<string>();
    let node = nodeMap.get(nodeId);
    while (node) {
        if (visited.has(node.id)) {
            return;
        }
        visited.add(node.id);
        path.unshift({
            id: node.id,
            name: node.name,
        });
        node = node.parentId ? nodeMap.get(node.parentId) : undefined;
    }

    if (!path.length) {
        return;
    }

    return [{ id: rootName, name: rootName }, ...path];
}
