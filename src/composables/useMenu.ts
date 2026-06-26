import type { MenuCommand, MenuSection } from '@/generated/bindings';

import { platform } from '@tauri-apps/plugin-os';
import { createGlobalState } from '@vueuse/core';

import { closeWorld, newWorld, openWorld } from '@/actions/world';
import { openAboutDialog } from '@/dialogs';
import { commands, events } from '@/generated/bindings';

function createMenu() {
    const menus = ref<MenuSection[]>([]);
    let initialized = false;

    const initMenu = async () => {
        if (initialized) {
            return;
        }
        initialized = true;

        if (platform() !== 'macos') {
            const result = await commands.getAppMenu();
            if (result.status === 'ok') {
                menus.value = result.data;
            }
        }

        await events.menuCommand.listen(async ({ payload }) => {
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
