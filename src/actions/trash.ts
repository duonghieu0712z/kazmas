import { defineStore } from 'pinia';

import { commands } from '@/generated/bindings';
import {
    AlertDialogButtons,
    AlertDialogKind,
    AlertDialogResult,
    openAlertDialog,
} from '@/providers/dialog';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

export const useTrashActions = defineStore('trash-actions', () => {
    const world = useWorldStore();
    const nodes = useNodeStore();

    const busy = ref(false);
    const error = ref('');

    watch(
        () => world.manifest?.id,
        () => {
            error.value = '';
        },
    );

    const run = async (action: 'restore' | 'restore-all' | 'purge' | 'empty', id?: string) => {
        const worldId = world.manifest?.id;
        if (!worldId || busy.value || (id && !nodes.trashTree.some((node) => node.id === id))) {
            return;
        }

        if ((action === 'empty' || action === 'restore-all') && !nodes.trashNodes.length) {
            return;
        }

        busy.value = true;
        error.value = '';
        let changed = false;
        try {
            if (action === 'empty' || action === 'purge') {
                const name = nodes.trashNodes.find((node) => node.id === id)?.name;
                const confirmed = await openAlertDialog({
                    title: action === 'empty' ? 'Empty Trash' : 'Delete Permanently',
                    content:
                        action === 'empty'
                            ? 'Permanently delete all items in Trash and their contents? This cannot be undone.'
                            : `Permanently delete "${name}" and its contents? This cannot be undone.`,
                    kind: AlertDialogKind.Warning,
                    buttons: AlertDialogButtons.OkCancel,
                    buttonLabels: { ok: 'Delete Permanently' },
                });
                if (confirmed !== AlertDialogResult.Ok) {
                    return;
                }
            }

            await world.waitForCreations();
            if (world.manifest?.id !== worldId) {
                return;
            }

            let operation;
            switch (action) {
                case 'empty':
                    operation = commands.emptyTrash();
                    break;
                case 'restore-all':
                    operation = commands.restoreTrash();
                    break;
                case 'restore':
                    operation = commands.restoreNode(id!);
                    break;
                case 'purge':
                    operation = commands.purgeNode(id!);
                    break;
            }

            const result = await world.trackCreation(operation);
            if (world.manifest?.id !== worldId) {
                return;
            }

            if (result.status !== 'ok' || result.data !== true) {
                throw new Error('Trash operation failed');
            }

            changed = true;
            world.markDirty();
            if (!(await nodes.reloadNodes()) && world.manifest?.id === worldId) {
                throw new Error('Trash refresh failed');
            }
        } catch {
            if (world.manifest?.id === worldId) {
                error.value = changed
                    ? 'The change was applied, but the list could not be refreshed. Try again.'
                    : 'The Trash operation could not be completed. Try again.';
                await openAlertDialog({
                    title: 'Trash',
                    content: error.value,
                    kind: AlertDialogKind.Error,
                });
            }
        } finally {
            busy.value = false;
        }
    };

    return {
        busy,
        error,
        restore: async (id: string) => await run('restore', id),
        restoreAll: async () => await run('restore-all'),
        purge: async (id: string) => await run('purge', id),
        empty: async () => await run('empty'),
    };
});

export async function emptyTrash() {
    await useTrashActions().empty();
}
