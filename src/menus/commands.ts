import type { MenuCommand } from '@/generated/bindings';

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

import { closeWorld, newWorld, openWorld } from '@/actions/world';
import { openAboutDialog } from '@/dialogs';
import { commands, events } from '@/generated/bindings';
import { isMac } from '@/utils/platform';

type MenuCommandHandler = () => Promise<void>;

const backendMenuCommands = new Set<MenuCommand>([
    'close-window',
    'new-window',
    'quit',
    'save',
    'save-as',
    'toggle-devtools',
]);

const frontendMenuHandlers: Partial<Record<MenuCommand, MenuCommandHandler>> = {
    about: openAboutDialog,
    'close-world': closeWorld,
    'new-folder': createFolder,
    'new-manuscript-entry': createManuscriptEntry,
    'new-world': newWorld,
    'new-wiki-entry': createWikiEntry,
    'open-world': openWorld,
};

async function createFolder() {
    await commands.createFolder(null, null);
}

async function createManuscriptEntry() {
    await commands.createManuscriptEntry(null, null);
}

async function createWikiEntry() {
    await commands.createWikiEntry(null, null);
}

export async function executeMenuCommand(command: MenuCommand) {
    const handler = frontendMenuHandlers[command];
    if (handler) {
        await handler();
        return;
    }

    if (backendMenuCommands.has(command)) {
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
