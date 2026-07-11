import type { NodeDto } from '@/generated/bindings';

import { defineStore } from 'pinia';

import { commands } from '@/generated/bindings';

export type NodeTreeDto = NodeDto & {
    children: NodeTreeDto[];
};

export const useNodeStore = defineStore('nodes', () => {
    const manuscriptNodes = shallowRef<NodeDto[]>([]);
    const wikiNodes = shallowRef<NodeDto[]>([]);
    const selectedNodeId = shallowRef<string | null>(null);

    const manuscripts = computed(() => buildNodeTree(manuscriptNodes.value));
    const wikis = computed(() => buildNodeTree(wikiNodes.value));

    const clearNodes = () => {
        manuscriptNodes.value = [];
        wikiNodes.value = [];
        selectedNodeId.value = null;
    };

    const loadManuscripts = async () => {
        const result = await commands.getManuscripts();
        if (result.status === 'ok') {
            manuscriptNodes.value = result.data ?? [];
        }
    };

    const loadWikis = async () => {
        const result = await commands.getWikis();
        if (result.status === 'ok') {
            wikiNodes.value = result.data ?? [];
        }
    };

    const reloadNodes = async () => {
        await Promise.all([loadManuscripts(), loadWikis()]);
    };

    return {
        manuscripts,
        wikis,
        selectedNodeId,
        clearNodes,
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
