import { commands } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

export type NodeRename = { id: string; name: string; saving: boolean; error: string };

export function useRenameNode() {
    const nodes = useNodeStore();
    const world = useWorldStore();
    const rename = ref<NodeRename | null>(null);

    watch(
        () => world.manifest?.id,
        () => {
            rename.value = null;
        },
        { flush: 'sync' },
    );

    const start = (id: string) => {
        const node = nodes.getNode(id);
        if (node && world.hasWorld && !rename.value) {
            rename.value = { id, name: node.name, saving: false, error: '' };
        }
    };

    const cancel = () => {
        if (!rename.value?.saving) {
            rename.value = null;
        }
    };

    const submit = async () => {
        const pending = rename.value;
        const worldId = world.manifest?.id;
        if (!pending || pending.saving || !worldId) {
            return;
        }
        const node = nodes.getNode(pending.id);
        const name = pending.name.trim();
        if (!node) {
            cancel();
            return;
        }
        if (!name) {
            pending.error = 'Enter a name.';
            return;
        }
        if (name === node.name) {
            cancel();
            return;
        }
        pending.saving = true;
        pending.error = '';
        let renamed = false;
        try {
            await world.trackCreation(
                (async () => {
                    const result = await commands.updateNode({
                        id: node.id,
                        parentId: node.parentId,
                        name,
                    });
                    if (rename.value !== pending || world.manifest?.id !== worldId) {
                        return;
                    }
                    if (result.status !== 'ok' || result.data !== true) {
                        pending.error = 'The item could not be renamed.';
                        return;
                    }
                    renamed = true;
                    world.markDirty();
                    await nodes.reloadNodes();
                    if (rename.value !== pending || world.manifest?.id !== worldId) {
                        return;
                    }
                    if (nodes.getNode(node.id)?.name !== name) {
                        pending.error =
                            'The item was renamed, but the tree could not be refreshed.';
                        return;
                    }
                    rename.value = null;
                })(),
            );
        } catch {
            if (rename.value === pending) {
                pending.error = renamed
                    ? 'The item was renamed, but the tree could not be refreshed.'
                    : 'The item could not be renamed.';
            }
        } finally {
            pending.saving = false;
        }
    };

    return { rename, start, cancel, submit };
}
