import type { NodeTreeDto } from '@/stores/nodes';

import { useSessionStorage } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';

import { commands } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

export type NodeTreeSection = 'Manuscript' | 'Wiki';

interface NodeTreeState {
    query: string;
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

    const query = computed({
        get: () => state.value.query,
        set: (value: string) => {
            state.value.query = value;
            state.value.filteredExpanded = collectBranches(
                filterTree(props.tree, value.trim().toLocaleLowerCase()),
            );
        },
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

    const creating = ref(false);
    const createError = ref('');

    const search = computed(() => query.value.trim().toLocaleLowerCase());
    const filteredTree = computed(() => filterTree(props.tree, search.value));
    const hasBranches = computed(() => filteredTree.value.some((node) => node.children.length > 0));

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

    const createLabel = computed(() => `New ${props.section.toLowerCase()} entry`);
    const canCreate = computed(() => world.hasWorld && !creating.value);

    watch(
        () => world.manifest?.id,
        (worldId) => {
            if (worldId && !preferences.value[worldId]) {
                preferences.value[worldId] = createTreeState();
            }

            createError.value = '';
        },
        { immediate: true, flush: 'sync' },
    );

    const createNode = async (kind: 'entry' | 'folder') => {
        const worldId = world.manifest?.id;

        if (!worldId || creating.value) {
            return;
        }

        creating.value = true;
        createError.value = '';

        const label = kind === 'folder' ? 'Folder' : 'Entry';

        try {
            let result;

            if (kind === 'folder') {
                const section = props.section === 'Wiki' ? 'wiki' : 'manuscript';
                result = await commands.createFolder(null, null, section);
            } else if (props.section === 'Manuscript') {
                result = await commands.createManuscriptEntry(null, null);
            } else {
                result = await commands.createWikiEntry(null, null);
            }

            if (world.manifest?.id !== worldId) {
                return;
            }

            if (result.status !== 'ok' || !result.data) {
                createError.value = `${label} could not be created.`;
                return;
            }

            world.markDirty();
            await nodes.reloadNodes();
            await nextTick();

            if (world.manifest?.id !== worldId) {
                return;
            }

            const node = findNode(props.tree, result.data);

            if (node) {
                query.value = '';
                selected.value = node;
                nodes.selectNode(node);
                nodes.openNode(node);
            } else {
                createError.value = `${label} was created, but the tree could not be refreshed.`;
            }
        } catch {
            if (world.manifest?.id === worldId) {
                createError.value = `${label} could not be created.`;
            }
        } finally {
            creating.value = false;
        }
    };

    return {
        query,
        search,
        selected,
        filteredTree,
        hasBranches,
        visibleExpanded,
        canCreate,
        createLabel,
        createError,
        createEntry: () => createNode('entry'),
        createFolder: () => createNode('folder'),
        expandAll: () => {
            visibleExpanded.value = collectBranches(filteredTree.value);
        },
        collapseAll: () => {
            visibleExpanded.value = [];
        },
    };
}

function createTreeState(): NodeTreeState {
    return { query: '', expanded: [], filteredExpanded: [], selectedId: null };
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
