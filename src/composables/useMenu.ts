import type { MenuCommand, MenuGroup, ProjectPlacement } from '@/generated/bindings';

import { openAboutDialog, openSaveWorldDialog, openWindowPlacementDialog } from '@/dialogs';
import { commands } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';

type CommandResult<T> = { status: 'ok'; data: T } | { status: 'error'; error: { message: string } };

export function useMenu() {
    const menus = ref<MenuGroup[]>([]);

    onMounted(async () => {
        menus.value = await commands.getAppMenu();
    });

    async function executeMenuCommand(command: MenuCommand) {
        if (command === 'about') {
            await openAboutDialog();
            return;
        }

        if (command === 'new-world') {
            await newWorld();
            return;
        }

        if (command === 'open-world') {
            await openWorld();
            return;
        }

        if (command === 'close-world') {
            await closeWorld();
            return;
        }

        if (command === 'save') {
            await unwrapCommand(commands.saveFocusedWorld());
            return;
        }

        await unwrapCommand(commands.executeMenuCommand(command));
    }

    return {
        menus,
        executeMenuCommand,
    };
}

async function newWorld() {
    if (!(await confirmProjectTransition())) {
        return;
    }

    const placement = await chooseProjectPlacement();
    if (!placement) {
        return;
    }

    const dir = await unwrapCommand(commands.pickNewWorldDir());
    if (!dir) {
        return;
    }

    await unwrapCommand(commands.createWorld(dir, placement));
}

async function openWorld() {
    if (!(await confirmProjectTransition())) {
        return;
    }

    const placement = await chooseProjectPlacement();
    if (!placement) {
        return;
    }

    const file = await unwrapCommand(commands.pickWorldFile());
    if (!file) {
        return;
    }

    await unwrapCommand(commands.openWorld(file, placement));
}

async function closeWorld() {
    if (!(await confirmProjectTransition())) {
        return;
    }

    await unwrapCommand(commands.closeFocusedWorld());
}

async function confirmProjectTransition() {
    const transition = await unwrapCommand(commands.getProjectTransitionInfo());

    if (!transition.dirty) {
        return true;
    }

    const result = await openSaveWorldDialog(transition.worldName ?? undefined);
    if (result === AlertDialogResult.Yes) {
        await unwrapCommand(commands.saveFocusedWorld());
        return true;
    }

    return result === AlertDialogResult.No;
}

async function chooseProjectPlacement(): Promise<ProjectPlacement | null> {
    const result = await openWindowPlacementDialog();

    if (result === AlertDialogResult.Yes) {
        return 'newWindow';
    }

    if (result === AlertDialogResult.No) {
        return 'currentWindow';
    }

    return null;
}

async function unwrapCommand<T>(command: Promise<CommandResult<T>>) {
    const result = await command;
    if (result.status === 'ok') {
        return result.data;
    }

    throw new Error(result.error.message);
}
