import type { MenuCommand } from '@/generated/bindings';

import { closeWorld, newWorld, openWorld } from '@/actions/world';
import { openAboutDialog } from '@/dialogs';
import { commands, events } from '@/generated/bindings';
import { isMac } from '@/utils/platform';

type MenuCommandHandler = () => Promise<void>;

const backendMenuCommands = new Set<MenuCommand>(['new-window', 'save', 'toggle-devtools']);

const frontendMenuHandlers: Partial<Record<MenuCommand, MenuCommandHandler>> = {
    about: openAboutDialog,
    'close-world': closeWorld,
    'new-world': newWorld,
    'open-world': openWorld,
};

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

    await events.menuCommand.listen(async ({ payload }) => {
        await executeMenuCommand(payload);
    });

    listening = true;
}
