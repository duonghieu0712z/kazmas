import type { MenuCommand } from '@/generated/bindings';

import { emit } from '@tauri-apps/api/event';
import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';

import { manifest, node } from '../support/fixtures';

const scenario = new URLSearchParams(location.search).get('scenario') ?? 'editor';
const longName =
    'A very long chapter title that must remain accessible without breaking the workspace layout';
const entries = [
    node(),
    node({ id: 'entry-b', name: 'Chapter B' }),
    node({ id: 'entry-long', name: longName }),
];
const wikiEntries = [node({ id: 'wiki-a', kind: 'wiki_entry', name: 'Character' })];
const sectionRoots = [
    node({ id: 'manuscript-root', kind: 'manuscript', name: 'Manuscript' }),
    node({ id: 'wiki-root', kind: 'wiki', name: 'Wiki' }),
];

if (scenario === 'trash-order') {
    const deletedAt = '2026-01-01T00:00:00Z';
    entries.splice(
        0,
        entries.length,
        node({ id: 'z-file', name: 'Zebra file', deletedAt }),
        node({ id: 'a-file', name: 'apple file', deletedAt }),
        node({ id: 'z-folder', name: 'Zebra folder', kind: 'folder', deletedAt }),
        node({ id: 'a-folder', name: 'apple folder', kind: 'folder', deletedAt }),
        node({ id: 'nested-z-file', name: 'Zebra child', parentId: 'a-folder' }),
        node({ id: 'nested-a-file', name: 'apple child', parentId: 'a-folder' }),
        node({
            id: 'nested-z-folder',
            name: 'Zebra subfolder',
            parentId: 'a-folder',
            kind: 'folder',
        }),
        node({
            id: 'nested-a-folder',
            name: 'apple subfolder',
            parentId: 'a-folder',
            kind: 'folder',
        }),
    );
    wikiEntries.splice(
        0,
        wikiEntries.length,
        node({ id: 'wiki-file', kind: 'wiki_entry', name: 'apple page', deletedAt }),
        node({ id: 'wiki-z-folder', kind: 'folder', name: 'Zebra topics', deletedAt }),
        node({ id: 'wiki-a-folder', kind: 'folder', name: 'apple topics', deletedAt }),
    );
}

if (scenario === 'tree-state') {
    entries.splice(
        0,
        entries.length,
        node({ id: 'draft-folder', kind: 'folder', name: 'Draft' }),
        node({ parentId: 'draft-folder' }),
        node({ id: 'archive-folder', kind: 'folder', name: 'Archive' }),
        node({ id: 'entry-b', parentId: 'archive-folder', name: 'Chapter B' }),
    );
    wikiEntries.unshift(node({ id: 'wiki-folder', kind: 'folder', name: 'Characters' }));
    wikiEntries[1]!.parentId = 'wiki-folder';
}

if (scenario === 'large-tree') {
    entries.splice(0, entries.length);
    for (let index = 0; index < 20000; index++) {
        entries.push(
            node({ id: `large-${index}`, name: `Chapter ${String(index).padStart(5, '0')}` }),
        );
    }
}

for (const item of entries) {
    item.parentId ??= 'manuscript-root';
}
for (const item of wikiEntries) {
    item.parentId ??= 'wiki-root';
}

const documents = new Map(
    entries.map((entry) => [
        entry.id,
        JSON.stringify({
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'text',
                            text:
                                entry.id === 'entry-a'
                                    ? 'A sample manuscript for interface testing.'
                                    : 'Second chapter content.',
                        },
                    ],
                },
            ],
        }),
    ]),
);
const calls: { command: string; args: Record<string, unknown> }[] = [];
const pendingDocuments = new Map<string, () => void>();
let failedWrite = false;
let failedRename = false;

function visibleEntries(items: typeof entries) {
    const hidden = new Set(items.filter((item) => item.deletedAt).map((item) => item.id));
    let changed = true;
    while (changed) {
        changed = false;
        for (const item of items) {
            if (item.parentId && hidden.has(item.parentId) && !hidden.has(item.id)) {
                hidden.add(item.id);
                changed = true;
            }
        }
    }
    return items.filter((item) => !hidden.has(item.id));
}

function creationTarget(parentId: unknown, wiki: boolean) {
    if (typeof parentId === 'string') {
        if (entries.some((item) => item.id === parentId)) {
            return entries;
        }
        if (wikiEntries.some((item) => item.id === parentId)) {
            return wikiEntries;
        }
    }
    return wiki ? wikiEntries : entries;
}

const platforms: Record<string, string> = { darwin: 'macos', win32: 'windows', linux: 'linux' };
const platform = platforms[import.meta.env.VITE_UI_TEST_PLATFORM];
if (!platform) {
    throw new Error('The UI test host platform must be configured by Playwright.');
}
Object.assign(window, { __TAURI_OS_PLUGIN_INTERNALS__: { platform } });
mockWindows('test-window');
mockIPC(
    async (command, args) => {
        const data = (args ?? {}) as Record<string, unknown>;
        calls.push({ command, args: data });
        switch (command) {
            case 'get_node':
                return (
                    [...entries, ...wikiEntries, ...sectionRoots].find(
                        (item) => item.id === data.nodeId,
                    ) ?? null
                );
            case 'get_world':
                return scenario === 'empty' || scenario === 'dialog' ? null : manifest();
            case 'get_manuscripts':
                return visibleEntries(entries);
            case 'get_wikis':
                return visibleEntries(wikiEntries);
            case 'get_trash': {
                const all = [...entries, ...wikiEntries];
                const visible = new Set(visibleEntries(all).map((item) => item.id));
                return all.filter((item) => !visible.has(item.id));
            }
            case 'restore_trash': {
                const deleted = [...entries, ...wikiEntries].filter((item) => item.deletedAt);
                for (const item of deleted) {
                    item.deletedAt = null;
                }
                return deleted.length > 0;
            }
            case 'restore_node': {
                const item = [...entries, ...wikiEntries].find((item) => item.id === data.nodeId);
                if (!item?.deletedAt) {
                    return false;
                }
                item.deletedAt = null;
                return true;
            }
            case 'purge_node':
            case 'empty_trash': {
                const all = [...entries, ...wikiEntries];
                const removed = new Set(
                    all
                        .filter(
                            (item) =>
                                item.deletedAt &&
                                (command === 'empty_trash' || item.id === data.nodeId),
                        )
                        .map((item) => item.id),
                );
                let changed = true;
                while (changed) {
                    changed = false;
                    for (const item of all) {
                        if (item.parentId && removed.has(item.parentId) && !removed.has(item.id)) {
                            removed.add(item.id);
                            changed = true;
                        }
                    }
                }
                for (const items of [entries, wikiEntries]) {
                    for (let index = items.length - 1; index >= 0; index--) {
                        if (removed.has(items[index]!.id)) {
                            documents.delete(items[index]!.id);
                            items.splice(index, 1);
                        }
                    }
                }
                return removed.size > 0;
            }
            case 'create_manuscript_entry':
            case 'create_wiki_entry': {
                const wiki = command === 'create_wiki_entry';
                const target = creationTarget(data.parentId, wiki);
                const id = `${wiki ? 'wiki' : 'entry'}-new-${target.length}`;
                target.push(
                    node({
                        id,
                        name: typeof data.name === 'string' ? data.name : 'Untitled',
                        parentId: typeof data.parentId === 'string' ? data.parentId : null,
                        kind: wiki ? 'wiki_entry' : 'manuscript_entry',
                    }),
                );
                documents.set(
                    id,
                    JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
                );
                return id;
            }
            case 'create_folder': {
                const target = creationTarget(data.parentId, data.section === 'wiki');
                const id = `folder-new-${target.length}`;
                target.push(
                    node({
                        id,
                        name: typeof data.name === 'string' ? data.name : 'Untitled',
                        parentId: typeof data.parentId === 'string' ? data.parentId : null,
                        kind: 'folder',
                    }),
                );
                return id;
            }
            case 'update_node': {
                if (scenario === 'rename-error' && !failedRename) {
                    failedRename = true;
                    return Promise.reject({ code: 'IO', message: 'Rename failed.' });
                }
                const update = data.node as { id: string; name: string; parentId: string | null };
                const item = [...entries, ...wikiEntries].find((item) => item.id === update.id);
                if (!item || item.deletedAt) {
                    return false;
                }
                item.name = update.name;
                item.parentId = update.parentId;
                return true;
            }
            case 'delete_node': {
                const item = [...entries, ...wikiEntries].find((item) => item.id === data.nodeId);
                if (!item || item.deletedAt) {
                    return false;
                }
                item.deletedAt = new Date().toISOString();
                return true;
            }
            case 'get_document':
                if (scenario === 'load-error') {
                    return Promise.reject({ code: 'IO', message: 'Document read failed.' });
                }
                if (scenario === 'slow-document' && data.nodeId === 'entry-a') {
                    await new Promise<void>((resolve) => {
                        pendingDocuments.set(String(data.nodeId), resolve);
                    });
                }
                return documents.get(String(data.nodeId)) ?? null;
            case 'update_document':
                if ((scenario === 'save-error' && !failedWrite) || scenario === 'write-blocked') {
                    failedWrite = true;
                    return Promise.reject({ code: 'IO', message: 'Document write failed.' });
                }
                documents.set(String(data.nodeId), String(data.content));
                return true;
            case 'plugin:window|title':
                return 'Test World';
            case 'plugin:app|name':
                return 'Kazmas';
            case 'plugin:app|version':
                return '0.0.1';
            case 'plugin:window|is_maximized':
                return false;
            case 'plugin:dialog|open':
                return '/test/worlds';
            case 'plugin:window|set_title':
            case 'plugin:window|set_focus':
            case 'plugin:window|start_dragging':
            case 'plugin:window|toggle_maximize':
            case 'plugin:window|minimize':
            case 'plugin:window|close':
            case 'execute_menu_command':
                return null;
            default:
                throw new Error(`Unmocked IPC command: ${command}; args: ${JSON.stringify(data)}`);
        }
    },
    { shouldMockEvents: true },
);

const bridge = {
    calls,
    documents,
    menuCommand: (command: MenuCommand) => emit('menu-command', command),
    releaseDocument: (nodeId: string) => {
        const release = pendingDocuments.get(nodeId);
        if (!release) {
            throw new Error(`No pending document read: ${nodeId}`);
        }
        pendingDocuments.delete(nodeId);
        release();
    },
};

export type UiTestBridge = typeof bridge;

export async function initializeUiTest() {
    const [{ useNodeStore }, { useWorldStore }, { openNewWorldDialog }] = await Promise.all([
        import('@/stores/nodes'),
        import('@/stores/world'),
        import('@/dialogs'),
    ]);
    await useWorldStore().waitForNodes();
    if (
        !useNodeStore().openedNodeId &&
        ['editor', 'long', 'load-error', 'save-error', 'slow-document', 'write-blocked'].includes(
            scenario,
        )
    ) {
        useNodeStore().openNode(entries[scenario === 'long' ? 2 : 0]!);
    }
    if (scenario === 'dialog') {
        void openNewWorldDialog();
    }
    Object.assign(window, { __kazmasTest: bridge });
}
