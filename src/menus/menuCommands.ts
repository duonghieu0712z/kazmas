import type { MenuCommand } from '@/generated/bindings';

import { closeWorld, newWorld, openWorld } from '@/actions/world';
import { openAboutDialog } from '@/dialogs';
import { commands, events } from '@/generated/bindings';
import { isMac } from '@/utils/platform';

type MenuCommandHandler = () => Promise<void>;
let listening = false;

const menuHandlers: Partial<Record<MenuCommand, MenuCommandHandler>> = {
    about: openAboutDialog,
    'close-world': closeWorld,
    'new-world': newWorld,
    'open-world': openWorld,
};

export async function runMenuCommand(command: MenuCommand) {
    const handler = menuHandlers[command];
    if (handler) {
        await handler();
        return;
    }

    await commands.executeMenuCommand(command);
}

export async function listenNativeMenuCommands() {
    if (listening || !isMac()) {
        return;
    }

    await events.menuCommand.listen(async ({ payload }) => {
        await runMenuCommand(payload);
    });

    listening = true;
}
