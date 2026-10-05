import type { NodeTreeDto } from '@/stores/nodes';

import { useDebounceFn, useSessionStorage } from '@vueuse/core';

import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

export type NodeTreeSection = 'Manuscript' | 'Wiki';

interface NodeTreeState {
    query: string;
    filteredQuery: string;
    expanded: string[];
    filteredExpanded: string[];
    selectedId: string | null;
}

export function useNodeTree(props: { tree: NodeTreeDto[]; section: NodeTreeSection }) {
    const nodes = useNodeStore();
    const world = useWorldStore();

    const preferences = useSessionStorage<Record<string, NodeTreeState>>(
        `node_tree_state:${props.section}`,
        {},
    );
    const emptyState = ref(createTreeState());
    const state = computed(() => {
        const worldId = world.manifest?.id;

        return worldId ? (preferences.value[worldId] ?? emptyState.value) : emptyState.value;
    });

    const selected = computed({
        get: () => {
            const id = state.value.selectedId;

            return id ? findNode(props.tree, id) : undefined;
        },
        set: (node: NodeTreeDto | undefined) => {
            state.value.selectedId = node?.id ?? null;
        },
    });

    const search = ref('');
    const filteredTree = computed(() => filterTree(props.tree, search.value));
    const hasBranches = computed(() => filteredTree.value.some((node) => node.children.length > 0));

    const applySearch = (term: string) => {
        if (search.value !== term) {
            search.value = term;
            if (term) {
                state.value.filteredExpanded = collectBranches(filteredTree.value);
            }
        }
        state.value.filteredQuery = term;
    };
    const updateSearch = useDebounceFn(applySearch, 150);
    onScopeDispose(updateSearch.cancel);

    const query = computed({
        get: () => state.value.query,
        set: (value: string) => {
            state.value.query = value;
            updateSearch.cancel();
            const term = value.trim().toLocaleLowerCase();
            if (term) {
                void updateSearch(term);
            } else {
                applySearch('');
            }
        },
    });

    const visibleExpanded = computed({
        get: () => (search.value ? state.value.filteredExpanded : state.value.expanded),
        set: (value: string[]) => {
            if (search.value) {
                state.value.filteredExpanded = value;
            } else {
                state.value.expanded = value;
            }
        },
    });

    watch(
        () => world.manifest?.id,
        (worldId) => {
            updateSearch.cancel();
            if (worldId && !preferences.value[worldId]) {
                preferences.value[worldId] = createTreeState();
            }
            const term = state.value.query.trim().toLocaleLowerCase();
            search.value = state.value.filteredQuery ?? term;
            if (search.value !== term) {
                void updateSearch(term);
            }
        },
        { immediate: true, flush: 'sync' },
    );

    const revealAncestors = (parentId: string | null) => {
        let parent = parentId ? findNode(props.tree, parentId) : undefined;
        const expanded = new Set(state.value.expanded);
        const visited = new Set<string>();
        while (parent && !visited.has(parent.id)) {
            visited.add(parent.id);
            expanded.add(parent.id);
            parent = parent.parentId ? findNode(props.tree, parent.parentId) : undefined;
        }
        state.value.expanded = [...expanded];
    };

    return {
        query,
        search,
        selected,
        filteredTree,
        hasBranches,
        visibleExpanded,
        revealChildren: (parentId: string | null) => {
            query.value = '';
            revealAncestors(parentId);
        },
        revealNode: (nodeId: string) => {
            const node = findNode(props.tree, nodeId);
            if (!node) {
                return false;
            }
            query.value = '';
            revealAncestors(node.parentId);
            selected.value = node;
            nodes.selectNode(node);
            nodes.openNode(node);
            return true;
        },
        expandAll: () => {
            visibleExpanded.value = collectBranches(filteredTree.value);
        },
        collapseAll: () => {
            visibleExpanded.value = [];
        },
    };
}

function createTreeState(): NodeTreeState {
    return { query: '', filteredQuery: '', expanded: [], filteredExpanded: [], selectedId: null };
}

function filterTree(tree: NodeTreeDto[], term: string): NodeTreeDto[] {
    if (!term) {
        return tree;
    }

    return tree.flatMap((node) => {
        if (node.name.toLocaleLowerCase().includes(term)) {
            return [node];
        }

        const children = filterTree(node.children, term);
        return children.length ? [{ ...node, children }] : [];
    });
}

function collectBranches(tree: NodeTreeDto[]): string[] {
    return tree.flatMap((node) =>
        node.children.length ? [node.id, ...collectBranches(node.children)] : [],
    );
}

function findNode(tree: NodeTreeDto[], id: string): NodeTreeDto | undefined {
    for (const node of tree) {
        if (node.id === id) {
            return node;
        }

        const child = findNode(node.children, id);
        if (child) {
            return child;
        }
    }
}
