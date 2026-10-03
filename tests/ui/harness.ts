import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';
import { nextTick } from 'vue';

import { manifest, node } from '../unit/fixtures';

const scenario = new URLSearchParams(location.search).get('scenario') ?? 'editor';
const longName =
    'A very long chapter title that must remain accessible without breaking the workspace layout';
const entries = [
    node(),
    node({ id: 'entry-b', name: 'Chapter B' }),
    node({ id: 'entry-long', name: longName }),
];
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

Object.assign(window, { __TAURI_OS_PLUGIN_INTERNALS__: { platform: 'windows' } });
mockWindows('test-window');
mockIPC((command, args) => {
    const data = (args ?? {}) as Record<string, unknown>;
    calls.push({ command, args: data });
    switch (command) {
        case 'get_world':
            return scenario === 'empty' || scenario === 'dialog' ? null : manifest();
        case 'get_manuscripts':
            return entries;
        case 'get_wikis':
            return [node({ id: 'wiki-a', kind: 'wiki_entry', name: 'Character' })];
        case 'get_document':
            return documents.get(String(data.nodeId)) ?? null;
        case 'update_document':
            documents.set(String(data.nodeId), String(data.content));
            return true;
        case 'plugin:window|title':
            return 'Test World';
        case 'plugin:window|is_maximized':
            return false;
        case 'plugin:dialog|open':
            return '/test/worlds';
        case 'plugin:event|listen':
            return calls.length;
        default:
            return null;
    }
});

export async function initializeUiTest() {
    const [{ useNodeStore }, { openNewWorldDialog }] = await Promise.all([
        import('@/stores/nodes'),
        import('@/dialogs'),
    ]);
    await nextTick();
    if (scenario === 'editor' || scenario === 'long') {
        useNodeStore().openNode(entries[scenario === 'long' ? 2 : 0]!);
    }
    if (scenario === 'dialog') {
        void openNewWorldDialog();
    }
    Object.assign(window, { __kazmasTest: { calls, documents } });
}
