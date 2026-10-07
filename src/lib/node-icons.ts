import type { NodeKind } from '@/generated/bindings';

import { BookOpenIcon, FileTextIcon, FolderIcon, FolderOpenIcon } from '@lucide/vue';

export function getNodeIcon(kind: NodeKind | undefined, expanded = false) {
    if (kind === 'folder') {
        return expanded ? FolderOpenIcon : FolderIcon;
    }
    return kind === 'wiki_entry' ? BookOpenIcon : FileTextIcon;
}
