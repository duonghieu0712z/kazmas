import type { NodeTreeDto } from '@/stores/nodes';

import { commands } from '@/generated/bindings';
import { flushDocumentSaves } from '@/lib/document-saves';
import { useDialogProvider } from '@/providers/dialog';
import { useNodeStore } from '@/stores/nodes';
import { useWorkspaceStore } from '@/stores/workspace';
import { useWorldStore } from '@/stores/world';

import RenameNodeDialog from './RenameNodeDialog.vue';

type RenameNodeDialogComponent = new () => {
    $props: {
        payload: { nodeId: string; worldId: string; name: string };
        'onResolve:dialog'?: (name: string) => void;
    };
};

export function useNodeTreeActions(tree: () => NodeTreeDto[]) {
    const nodes = useNodeStore();
    const world = useWorldStore();
    const workspace = useWorkspaceStore();
    const { openDialog } = useDialogProvider();
    const busy = ref(false);
    const error = ref('');

    watch(
        () => world.manifest?.id,
        () => {
            error.value = '';
        },
    );

    const open = (id: string) => {
        const node = nodes.getNode(id);
        if (node) {
            nodes.selectNode(node);
            nodes.openNode(node);
        }
    };

    const rename = async (id: string) => {
        const node = nodes.getNode(id);
        const worldId = world.manifest?.id;
        if (!node || !worldId || busy.value) {
            return;
        }
        await openDialog<RenameNodeDialogComponent>({
            component: RenameNodeDialog as unknown as RenameNodeDialogComponent,
            payload: { nodeId: id, worldId, name: node.name },
        });
    };

    const trash = async (id: string) => {
        const worldId = world.manifest?.id;
        if (!worldId || busy.value) {
            return;
        }
        busy.value = true;
        error.value = '';
        let deleted = false;
        try {
            await world.waitForCreations();
            await flushDocumentSaves();
            await world.waitForCreations();
            const branch = findNode(tree(), id);
            if (!branch || world.manifest?.id !== worldId) {
                return;
            }
            const affected = new Set(collectIds(branch));
            const result = await world.trackCreation(commands.deleteNode(id));
            if (world.manifest?.id !== worldId) {
                return;
            }
            if (result.status !== 'ok' || result.data !== true) {
                error.value = 'The item could not be moved to Trash.';
                return;
            }
            deleted = true;
            world.markDirty();
            for (const tab of [...workspace.tabs]) {
                if (affected.has(tab.nodeId)) {
                    workspace.closeTab(tab.id);
                }
            }
            if (nodes.selectedNodeId && affected.has(nodes.selectedNodeId)) {
                nodes.selectedNodeId = null;
            }
            await nodes.reloadNodes();
            if (world.manifest?.id === worldId && nodes.getNode(id)) {
                error.value = 'The item was moved to Trash, but the tree could not be refreshed.';
            }
        } catch {
            if (world.manifest?.id === worldId) {
                error.value = deleted
                    ? 'The item was moved to Trash, but the tree could not be refreshed.'
                    : 'The item could not be moved to Trash. Check that pending changes can be saved.';
            }
        } finally {
            busy.value = false;
        }
    };

    return { open, rename, trash, busy, error };
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

function collectIds(node: NodeTreeDto): string[] {
    return [node.id, ...node.children.flatMap(collectIds)];
}
