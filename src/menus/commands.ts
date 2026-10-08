import type { MenuCommand } from './types';
import type { MenuCommand as RustMenuCommand } from '@/generated/bindings';

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

import { closeWorld, newWorld, openWorld } from '@/actions/world';
import { openAboutDialog } from '@/dialogs';
import { commands, events } from '@/generated/bindings';
import { flushDocumentSaves } from '@/lib/document-saves';
import { useWorldStore } from '@/stores/world';
import { isMac } from '@/utils/platform';

type MenuCommandHandler = () => Promise<void>;

const backendMenuCommands = new Set<RustMenuCommand>([
    'close-window',
    'new-window',
    'quit',
    'reload-window',
    'save',
    'save-as',
    'toggle-devtools',
]);

const frontendMenuHandlers: Partial<Record<RustMenuCommand, MenuCommandHandler>> = {
    about: openAboutDialog,
    'close-world': closeWorld,
    'new-folder': createFolder,
    'new-manuscript-entry': createManuscriptEntry,
    'new-world': newWorld,
    'new-wiki-entry': createWikiEntry,
    'open-world': openWorld,
};

async function createFolder() {
    await commands.createFolder(null, null, 'manuscript');
}

async function createManuscriptEntry() {
    await commands.createManuscriptEntry(null, null);
}

async function createWikiEntry() {
    await commands.createWikiEntry(null, null);
}

export async function executeMenuCommand(command: MenuCommand) {
    if (typeof command !== 'string') {
        await command.execute();
        return;
    }

    const handler = frontendMenuHandlers[command];
    if (handler) {
        await handler();
        return;
    }

    if (backendMenuCommands.has(command)) {
        if (['save', 'save-as', 'close-window', 'quit'].includes(command)) {
            await useWorldStore().waitForCreations();
            await flushDocumentSaves();
        }
        await commands.executeMenuCommand(command);
        return;
    }

    console.warn(`Menu command ${command} is not handled`);
}

let listening = false;

export async function listenNativeMenuCommands() {
    if (listening || !isMac()) {
        return;
    }

    const window = getCurrentWebviewWindow();
    await events.menuCommand(window).listen(async ({ payload }) => {
        await executeMenuCommand(payload);
    });

    listening = true;
}
