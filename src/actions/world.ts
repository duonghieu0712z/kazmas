import { open } from '@tauri-apps/plugin-dialog';

import { openWindowPlacementDialog } from '@/dialogs';
import { commands, EXTENSION } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';
import { useWorldStore } from '@/stores/world';

export async function loadWorld() {
    const world = useWorldStore();
    const result = await commands.getWorld();
    if (result.status !== 'ok') {
        return;
    }

    if (result.data) {
        world.setManifest(result.data);
    } else {
        world.clearManifest();
    }
}

export async function newWorld() {
    const world = useWorldStore();
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

    const result = await commands.createWorld('New World', path, newWindow);
    if (result.status === 'ok' && result.data) {
        world.setManifest(result.data);
    }
}

export async function openWorld() {
    const world = useWorldStore();
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
    const result = await commands.closeWorld();
    if (result.status === 'ok') {
        world.clearManifest();
    }
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
