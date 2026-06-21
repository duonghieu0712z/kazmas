import type { MenuCommand, MenuSection } from '@/generated/bindings';

import { createGlobalState } from '@vueuse/core';

import { openAboutDialog, openSaveWorldDialog, openWindowPlacementDialog } from '@/dialogs';
import { commands } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';

function createMenu() {
    const menus = ref<MenuSection[]>([]);

    onMounted(async () => {
        const result = await commands.getAppMenu();
        if (result.status === 'ok') {
            menus.value = result.data;
        }
    });

    const executeMenuCommand = async (command: MenuCommand) => {
        switch (command) {
            case 'about':
                await openAboutDialog();
                return;

            case 'new-world':
                await newWorld();
                return;

            case 'open-world':
                await openWorld();
                return;

            case 'close-world':
                await closeWorld();
                return;

            case 'save':
                await commands.saveFocusedWorld();
                return;

            default:
                await commands.executeMenuCommand(command);
        }
    };

    return {
        menus,
        executeMenuCommand,
    };
}

export const useMenu = createGlobalState(createMenu);

async function newWorld() {
    if (!(await confirmProjectTransition())) {
        return;
    }

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
    if (!(await confirmProjectTransition())) {
        return;
    }

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
    if (!(await confirmProjectTransition())) {
        return;
    }

    await commands.closeFocusedWorld();
}

async function confirmProjectTransition() {
    const transition = await commands.getProjectTransitionInfo();
    if (transition.status === 'error') {
        return false;
    }

    if (!transition.data.dirty) {
        return true;
    }

    const result = await openSaveWorldDialog(transition.data.worldName ?? undefined);
    if (result === AlertDialogResult.Yes) {
        const saveResult = await commands.saveFocusedWorld();
        return saveResult.status === 'ok';
    }

    return result === AlertDialogResult.No;
}

async function chooseNewWindow(): Promise<boolean | null> {
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
