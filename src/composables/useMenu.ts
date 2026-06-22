import type { MenuCommand, MenuSection } from '@/generated/bindings';

import { open } from '@tauri-apps/plugin-dialog';
import { platform } from '@tauri-apps/plugin-os';
import { createGlobalState } from '@vueuse/core';

import { openAboutDialog, openWindowPlacementDialog } from '@/dialogs';
import { commands, events, EXTENSION } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';

function createMenu() {
    const menus = ref<MenuSection[]>([]);
    let initialized = false;

    const initMenu = async () => {
        if (initialized) {
            return;
        }
        initialized = true;

        if (platform() === 'macos') {
            const result = await commands.getAppMenu();
            if (result.status === 'ok') {
                menus.value = result.data;
            }
        }

        events.menuEvents.listen(async ({ payload }) => {
            await handleMenuCommand(payload);
        });
    };

    const executeMenuCommand = async (command: MenuCommand) => {
        if (await handleMenuCommand(command)) {
            return;
        }
        await commands.executeMenuCommand(command);
    };

    return {
        menus,
        initMenu,
        executeMenuCommand,
    };
}

export const useMenu = createGlobalState(createMenu);

async function handleMenuCommand(command: MenuCommand) {
    switch (command) {
        case 'about':
            await openAboutDialog();
            return true;

        case 'close-world':
            await closeWorld();
            return true;

        case 'new-world':
            await newWorld();
            return true;

        case 'open-world':
            await openWorld();
            return true;
    }

    return false;
}

async function newWorld() {
    const newWindow = await chooseNewWindow();
    if (newWindow === null) {
        return;
    }

    const path = await open({
        title: 'New World',
        multiple: false,
        directory: true,
        canCreateDirectories: true,
    });
    if (!path) {
        return;
    }

    await commands.createWorld('New World', path, newWindow);
}

async function openWorld() {
    const newWindow = await chooseNewWindow();
    if (newWindow === null) {
        return;
    }

    const file = await open({
        title: 'Open World',
        multiple: false,
        directory: false,
        canCreateDirectories: false,
        filters: [
            {
                name: 'Kazmas World',
                extensions: [EXTENSION],
            },
        ],
    });
    if (!file) {
        return;
    }

    await commands.openWorld(file, newWindow);
}

async function closeWorld() {
    await commands.closeWorld();
}

async function chooseNewWindow() {
    const result = await openWindowPlacementDialog();
    switch (result) {
        case AlertDialogResult.Yes:
            return true;
        case AlertDialogResult.No:
            return false;
        default:
            return null;
    }
}
