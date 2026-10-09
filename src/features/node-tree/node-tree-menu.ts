import type { NodeDraft } from './use-create-node';
import type { MenuActionItem, MenuItem } from '@/menus';
import type { NodeTreeDto } from '@/stores/nodes';

export type NodeTreeMenuActions = {
    open: (id: string) => void;
    create: (
        type: NodeDraft['type'],
        parentId: string | null,
        entryKind?: NodeDraft['entryKind'],
    ) => void;
    rename: (id: string) => void;
    trash: (id: string) => Promise<void>;
};

export function createNodeTreeMenuItems(
    node: NodeTreeDto | undefined,
    canCreate: boolean,
    canModify: boolean,
    actions: NodeTreeMenuActions,
): MenuItem[] {
    const items: MenuItem[] = [];
    const parentId = node?.id ?? null;
    if (!node || node.kind === 'folder') {
        items.push(
            {
                type: 'submenu',
                id: 'new-file',
                text: 'New File',
                enabled: canCreate,
                items: [
                    item(
                        'new-manuscript',
                        'New Manuscript',
                        () => actions.create('entry', parentId, 'manuscript_entry'),
                        { enabled: canCreate },
                    ),
                    item(
                        'new-wiki',
                        'New Wiki',
                        () => actions.create('entry', parentId, 'wiki_entry'),
                        { enabled: canCreate },
                    ),
                ],
            },
            item('new-folder', 'New Folder', () => actions.create('folder', parentId), {
                enabled: canCreate,
            }),
        );
    } else {
        items.push(item('open', 'Open', () => actions.open(node.id), { enabled: canModify }));
    }
    if (node) {
        items.push(
            { type: 'separator', id: 'node-edit-separator' },
            item('rename', 'Rename', () => actions.rename(node.id), {
                enabled: canModify,
            }),
            { type: 'separator', id: 'node-trash-separator' },
            item('move-to-trash', 'Move to Trash', async () => await actions.trash(node.id), {
                enabled: canModify,
                variant: 'destructive',
            }),
        );
    }
    return items;
}

function item(
    id: string,
    text: string,
    execute: () => void | Promise<void>,
    options: Pick<MenuActionItem, 'enabled' | 'variant'> = {},
): MenuActionItem {
    return { type: 'item', id, text, command: { type: 'frontend', id, execute }, ...options };
}
