import type { MenuCommand, MenuGroup, ProjectPlacement } from '@/generated/bindings';

import { createGlobalState } from '@vueuse/core';

import { openAboutDialog, openSaveWorldDialog, openWindowPlacementDialog } from '@/dialogs';
import { commands } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';

function createMenu() {
    const menus = ref<MenuGroup[]>([]);

    onMounted(async () => {
        menus.value = await commands.getAppMenu();
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

    const placement = await chooseProjectPlacement();
    if (!placement) {
        return;
    }

    const dir = await commands.pickNewWorldDir();
    if (dir.status === 'error') {
        return;
    }

    if (!dir.data) {
        return;
    }

    await commands.createWorld(dir.data, placement);
}

async function openWorld() {
    if (!(await confirmProjectTransition())) {
        return;
    }

    const placement = await chooseProjectPlacement();
    if (!placement) {
        return;
    }

    const file = await commands.pickWorldFile();
    if (file.status === 'error') {
        return;
    }

    if (!file.data) {
        return;
    }

    await commands.openWorld(file.data, placement);
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

async function chooseProjectPlacement(): Promise<ProjectPlacement | null> {
    const result = await openWindowPlacementDialog();

    switch (result) {
        case AlertDialogResult.Yes:
            return 'newWindow';
        case AlertDialogResult.No:
            return 'currentWindow';
        default:
            return null;
    }
}
