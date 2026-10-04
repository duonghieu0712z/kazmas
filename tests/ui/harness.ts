import type { MenuCommand } from '@/generated/bindings';

import { emit } from '@tauri-apps/api/event';
import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';
import { nextTick } from 'vue';

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
            case 'get_world':
                return scenario === 'empty' || scenario === 'dialog' ? null : manifest();
            case 'get_manuscripts':
                return [...entries];
            case 'get_wikis':
                return [...wikiEntries];
            case 'create_manuscript_entry':
            case 'create_wiki_entry': {
                const wiki = command === 'create_wiki_entry';
                const target = wiki ? wikiEntries : entries;
                const id = `${wiki ? 'wiki' : 'entry'}-new-${target.length}`;
                target.push(
                    node({ id, name: 'Untitled', kind: wiki ? 'wiki_entry' : 'manuscript_entry' }),
                );
                documents.set(
                    id,
                    JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
                );
                return id;
            }
            case 'create_folder': {
                const target = data.section === 'wiki' ? wikiEntries : entries;
                const id = `folder-new-${target.length}`;
                target.push(node({ id, name: 'Untitled', kind: 'folder' }));
                return id;
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
                if (scenario === 'save-error' && !failedWrite) {
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
    const [{ useNodeStore }, { openNewWorldDialog }] = await Promise.all([
        import('@/stores/nodes'),
        import('@/dialogs'),
    ]);
    await nextTick();
    if (['editor', 'long', 'load-error', 'save-error', 'slow-document'].includes(scenario)) {
        useNodeStore().openNode(entries[scenario === 'long' ? 2 : 0]!);
    }
    if (scenario === 'dialog') {
        void openNewWorldDialog();
    }
    Object.assign(window, { __kazmasTest: bridge });
}
