import type { NodeDto } from '@/generated/bindings';

import { defineStore } from 'pinia';

import { commands } from '@/generated/bindings';
import { useWorkspaceStore } from '@/stores/workspace';

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
    const trashNodes = shallowRef<NodeDto[]>([]);
    const trashAncestors = shallowRef<NodeDto[]>([]);
    const trashError = ref('');
    const selectedNodeId = shallowRef<string | null>(null);

    const workspace = useWorkspaceStore();
    const openedNodeId = computed(() => workspace.activeDocumentId);
    let revision = 0;
    const treeRequest = shallowRef<
        | { action: 'reveal'; nodeId: string; sequence: number }
        | {
              action: 'create';
              section: 'Manuscript' | 'Wiki';
              entryKind: 'manuscript_entry' | 'wiki_entry';
              sequence: number;
          }
        | null
    >(null);
    let treeRequestSequence = 0;

    const manuscripts = computed(() => buildNodeTree(manuscriptNodes.value));
    const wikis = computed(() => buildNodeTree(wikiNodes.value));
    const trashTree = computed(() => buildNodeTree(trashNodes.value));
    const trashLocations = computed(() => {
        const all = [...trashNodes.value, ...trashAncestors.value];
        return new Map(
            trashNodes.value.map((node) => {
                const path = buildNodePath('', all, node.id)?.slice(1) ?? [];
                const root = all.find((item) => item.id === path[0]?.id);
                const section = root?.kind === 'wiki' ? 'Wiki' : 'Manuscript';
                return [
                    node.id,
                    {
                        section,
                        path: path
                            .slice(0, -1)
                            .map((item) => item.name)
                            .join(' / '),
                    },
                ];
            }),
        );
    });
    const openedNodePath = computed(() => {
        if (!openedNodeId.value) {
            return [];
        }

        return getNodePath(openedNodeId.value);
    });

    const getNode = (nodeId: string) =>
        manuscriptNodes.value.find((node) => node.id === nodeId) ??
        wikiNodes.value.find((node) => node.id === nodeId);

    const getNodePath = (nodeId: string) => {
        return (
            buildNodePath('Manuscript', manuscriptNodes.value, nodeId) ??
            buildNodePath('Wiki', wikiNodes.value, nodeId) ??
            []
        );
    };

    watch(
        openedNodeId,
        (nodeId) => {
            if (nodeId) {
                selectedNodeId.value = nodeId;
            }
        },
        { flush: 'sync' },
    );

    const clearNodes = () => {
        revision += 1;
        manuscriptNodes.value = [];
        wikiNodes.value = [];
        trashNodes.value = [];
        trashAncestors.value = [];
        trashError.value = '';
        selectedNodeId.value = null;
        treeRequest.value = null;
        workspace.resetWorld();
    };

    const selectNode = (node: NodeDto) => {
        selectedNodeId.value = node.id;
    };

    const openNode = (node: NodeDto) => {
        if (node.kind === 'manuscript_entry' || node.kind === 'wiki_entry') {
            workspace.openDocument(node.id);
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
        const results = await Promise.all([loadManuscripts(), loadWikis(), loadTrash()]);
        return results.every((result) => result !== false);
    };

    const loadTrash = async () => {
        const currentRevision = revision;
        try {
            const result = await commands.getTrash();
            if (currentRevision !== revision) {
                return false;
            }
            if (result.status === 'ok') {
                const trash = result.data ?? [];
                const known = new Map(trash.map((node) => [node.id, node]));
                const ancestors: NodeDto[] = [];
                for (const item of trash) {
                    let parentId = item.parentId;
                    while (parentId && !known.has(parentId)) {
                        const parent = await commands.getNode(parentId);
                        if (currentRevision !== revision) {
                            return false;
                        }
                        if (parent.status !== 'ok' || !parent.data) {
                            throw new Error('Trash location could not be loaded');
                        }
                        known.set(parentId, parent.data);
                        ancestors.push(parent.data);
                        parentId =
                            parent.data.kind === 'manuscript' || parent.data.kind === 'wiki'
                                ? null
                                : parent.data.parentId;
                    }
                }
                trashNodes.value = trash;
                trashAncestors.value = ancestors;
                trashError.value = '';
                return trashNodes.value;
            }
        } catch {
            if (currentRevision !== revision) {
                return false;
            }
        }
        trashError.value = 'Trash could not be loaded. Try again.';
        return false;
    };

    return {
        manuscripts,
        wikis,
        trashNodes,
        trashTree,
        trashLocations,
        trashError,
        loadTrash,
        selectedNodeId,
        openedNodeId,
        openedNodePath,
        getNode,
        getNodePath,
        clearNodes,
        selectNode,
        openNode,
        loadManuscripts,
        loadWikis,
        reloadNodes,
        treeRequest,
        createEntryInTree: (entryKind: 'manuscript_entry' | 'wiki_entry') => {
            treeRequest.value = {
                action: 'create',
                entryKind,
                section: entryKind === 'manuscript_entry' ? 'Manuscript' : 'Wiki',
                sequence: ++treeRequestSequence,
            };
        },
        revealInTree: (nodeId: string) => {
            if (getNode(nodeId)) {
                treeRequest.value = { action: 'reveal', nodeId, sequence: ++treeRequestSequence };
            }
        },
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
