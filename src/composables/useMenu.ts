import type { MenuCommand, MenuSection } from '@/generated/bindings';

import { createGlobalState } from '@vueuse/core';

import { openAboutDialog, openWindowPlacementDialog } from '@/dialogs';
import { commands, events } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';

function createMenu() {
    const menus = ref<MenuSection[]>([]);

    onMounted(async () => {
        const result = await commands.getAppMenu();
        if (result.status === 'ok') {
            menus.value = result.data;
        }

        events.menuEvents.listen(async ({ payload }) => {
            await executeMenuCommand(payload);
        });
    });

    const executeMenuCommand = async (command: MenuCommand) => {
        if (await executeClientMenuCommand(command)) {
            return;
        }
        await commands.executeMenuCommand(command);
    };

    return {
        menus,
        executeMenuCommand,
    };
}

export const useMenu = createGlobalState(createMenu);

async function executeClientMenuCommand(command: MenuCommand) {
    switch (command) {
        case 'about':
            await openAboutDialog();
            return true;

        case 'new-world':
            await newWorld();
            return true;

        case 'open-world':
            await openWorld();
            return true;

        case 'close-world':
            await closeWorld();
            return true;

        case 'save':
            await commands.saveWorld();
            return true;
    }

    return false;
}

async function newWorld() {
    const newWindow = await chooseNewWindow();
    if (newWindow === null) {
        return;
    }

    const dir = await commands.pickNewWorldDir();
    if (dir.status === 'error') {
        return;
    }

    if (!dir.data) {
        return;
    }

    await commands.createWorld(dir.data, newWindow);
}

async function openWorld() {
    const newWindow = await chooseNewWindow();
    if (newWindow === null) {
        return;
    }

    const file = await commands.pickWorldFile();
    if (file.status === 'error') {
        return;
    }

    if (!file.data) {
        return;
    }

    await commands.openWorld(file.data, newWindow);
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
