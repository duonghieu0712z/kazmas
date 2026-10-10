import type { NodeTreeDto } from '@/stores/nodes';

import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

export type TrashGroup = {
    id: string;
    name: string;
    items: NodeTreeDto[];
};

export function useTrashTree() {
    const nodes = useNodeStore();
    const world = useWorldStore();

    const query = ref('');
    const treeExpanded = ref<string[]>(['trash:Manuscript', 'trash:Wiki']);
    const filteredExpanded = ref<string[]>([]);
    const selected = ref<NodeTreeDto>();

    const grouped = computed<TrashGroup[]>(() =>
        ['Manuscript', 'Wiki'].map((section) => {
            const items = sortTree(
                nodes.trashTree.filter(
                    (node) => nodes.trashLocations.get(node.id)?.section === section,
                ),
            );
            return { id: `trash:${section}`, name: section, items };
        }),
    );
    const filteredGroups = computed(() => {
        const term = query.value.trim().toLowerCase();
        return grouped.value.map((group) => {
            const items = group.name.toLowerCase().includes(term)
                ? group.items
                : filterTree(group.items, term);
            return { ...group, items };
        });
    });
    const expanded = computed({
        get: () => (query.value.trim() ? filteredExpanded.value : treeExpanded.value),
        set: (value: string[]) => {
            if (query.value.trim()) {
                filteredExpanded.value = value;
            } else {
                treeExpanded.value = value;
            }
        },
    });

    watch(filteredGroups, (groups) => {
        filteredExpanded.value = groups.flatMap((group) => [
            group.id,
            ...collectBranches(group.items),
        ]);
    });

    watch(
        () => world.manifest?.id,
        () => {
            query.value = '';
            treeExpanded.value = ['trash:Manuscript', 'trash:Wiki'];
            filteredExpanded.value = [];
            selected.value = undefined;
        },
    );

    return {
        query,
        selected,
        filteredGroups,
        expanded,
        expandGroup: (group: TrashGroup) => {
            expanded.value = [
                ...new Set([...expanded.value, group.id, ...collectBranches(group.items)]),
            ];
        },
        collapseGroup: (group: TrashGroup) => {
            const branches = new Set(collectBranches(group.items));
            expanded.value = expanded.value.filter((id) => !branches.has(id));
        },
    };
}

function sortTree(tree: NodeTreeDto[]): NodeTreeDto[] {
    return tree.map((node) => ({ ...node, children: sortTree(node.children) })).sort(compareItems);
}

function compareItems(first: NodeTreeDto, second: NodeTreeDto) {
    const folderOrder = Number(second.kind === 'folder') - Number(first.kind === 'folder');
    return folderOrder || first.name.localeCompare(second.name, undefined, { sensitivity: 'base' });
}

function filterTree(tree: NodeTreeDto[], term: string): NodeTreeDto[] {
    if (!term) {
        return tree;
    }
    return tree.flatMap((node) => {
        if (node.name.toLowerCase().includes(term)) {
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
