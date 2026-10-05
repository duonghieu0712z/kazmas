import type { NodeTreeSection } from './use-node-tree';

import { commands } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

export type NodeDraft = {
    id: 'node-tree-draft';
    kind: 'draft';
    type: 'entry' | 'folder';
    parentId: string | null;
};

export function useCreateNode(
    props: { section: NodeTreeSection },
    draft: Ref<NodeDraft | null>,
    creating: Ref<boolean>,
) {
    const nodes = useNodeStore();
    const world = useWorldStore();
    const createError = ref('');
    const createName = ref('');

    let worldRevision = 0;

    watch(
        () => world.manifest?.id,
        () => {
            worldRevision += 1;
            draft.value = null;
            createName.value = '';
            createError.value = '';
        },
        { flush: 'sync' },
    );

    watch(draft, () => {
        createName.value = '';
        createError.value = '';
    });

    const cancelName = () => {
        if (!creating.value) {
            draft.value = null;
            createError.value = '';
        }
    };

    const createNode = async () => {
        const revision = worldRevision;
        const pending = draft.value;

        if (!world.hasWorld || !pending || creating.value) {
            return;
        }

        creating.value = true;
        createError.value = '';

        const { type, parentId } = pending;
        const name = createName.value.trim() || 'Untitled';
        const label = type === 'folder' ? 'Folder' : 'Entry';

        try {
            let result;

            if (type === 'folder') {
                const section = props.section === 'Wiki' ? 'wiki' : 'manuscript';
                result = await commands.createFolder(name, parentId, section);
            } else if (props.section === 'Manuscript') {
                result = await commands.createManuscriptEntry(name, parentId);
            } else {
                result = await commands.createWikiEntry(name, parentId);
            }

            if (worldRevision !== revision) {
                return;
            }

            if (result.status !== 'ok' || !result.data) {
                createError.value = `${label} could not be created.`;
                return;
            }

            world.markDirty();
            draft.value = null;
            await nodes.reloadNodes();
            await nextTick();

            if (worldRevision !== revision) {
                return;
            }

            return result.data;
        } catch {
            if (worldRevision === revision) {
                createError.value = `${label} could not be created.`;
            }
        } finally {
            creating.value = false;
        }
    };

    return {
        createName,
        createError,
        cancelName,
        submitName: createNode,
    };
}
