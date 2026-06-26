import { open } from '@tauri-apps/plugin-dialog';

import { openNewWorldDialog, openSaveWorldDialog, openWindowPlacementDialog } from '@/dialogs';
import { commands, EXTENSION } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';
import { useWorldStore } from '@/stores/world';

export async function newWorld() {
    const world = useWorldStore();
    if (!(await confirmWorldTransition())) {
        return;
    }

    const newWindow = await chooseNewWindow();
    if (newWindow === null) {
        return;
    }

    const input = await openNewWorldDialog();
    if (!input) {
        return;
    }

    const result = await commands.createWorld(input.name, input.path, newWindow);
    if (result.status === 'ok' && result.data) {
        world.setManifest(result.data);
    }
}

export async function openWorld() {
    const world = useWorldStore();
    if (!(await confirmWorldTransition())) {
        return;
    }

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

    const result = await commands.openWorld(file, newWindow);
    if (result.status === 'ok' && result.data) {
        world.setManifest(result.data);
    }
}

export async function closeWorld() {
    const world = useWorldStore();
    if (!(await confirmWorldTransition())) {
        return;
    }

    const result = await commands.closeWorld();
    if (result.status === 'ok') {
        world.clearManifest();
    }
}

async function confirmWorldTransition() {
    const world = useWorldStore();
    if (!world.isDirty) {
        return true;
    }

    const result = await openSaveWorldDialog(world.worldName ?? undefined);
    if (result === AlertDialogResult.Yes) {
        const saveResult = await commands.executeMenuCommand('save');
        if (saveResult.status === 'ok') {
            return true;
        }
        return false;
    }

    return result === AlertDialogResult.No;
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
