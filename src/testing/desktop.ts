import { invoke } from '@tauri-apps/api/core';

import { closeWorld } from '@/actions/world';
import { commands } from '@/generated/bindings';
import { flushDocumentSaves } from '@/lib/document-saves';
import { executeMenuCommand } from '@/menus';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

const bridge = {
    async create(name: string, path: string, newWindow = false) {
        const result = await commands.createWorld(name, path, newWindow);
        if (result.status !== 'ok') {
            throw new Error(result.error.message);
        }
        if (result.data) {
            useWorldStore().setManifest(result.data);
            await useWorldStore().waitForNodes();
        }
        return result.data;
    },
    async open(path: string, newWindow = false) {
        const result = await commands.openWorld(path, newWindow);
        if (result.status !== 'ok') {
            throw new Error(result.error.message);
        }
        if (result.data) {
            useWorldStore().setManifest(result.data);
            await useWorldStore().waitForNodes();
        }
        return result.data;
    },
    async entry(name: string) {
        const result = await commands.createManuscriptEntry(name, null);
        if (result.status !== 'ok' || !result.data) {
            throw new Error('Entry could not be created.');
        }
        await useNodeStore().reloadNodes();
        useNodeStore().openedNodeId = result.data;
        return result.data;
    },
    async saveAs(path: string) {
        await flushDocumentSaves();
        await invoke('test_save_world_as', { path });
    },
    close: closeWorld,
    newWindow: () => executeMenuCommand('new-window'),
    save: () => executeMenuCommand('save'),
    world: () => useWorldStore().manifest,
};

Object.assign(window, { __kazmasDesktopTest: bridge });

export type DesktopTestBridge = typeof bridge;
