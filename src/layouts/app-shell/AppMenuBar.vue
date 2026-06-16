<script setup lang="ts">
import type { MenuCommand, MenuGroup, ProjectPlacement } from '@/generated/bindings';

import { openAboutDialog, openSaveWorldDialog, openWindowPlacementDialog } from '@/dialogs';
import { commands } from '@/generated/bindings';
import { AlertDialogResult } from '@/providers/dialog';

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

function displayShortcut(shortcut: string) {
    return shortcut.replace('CmdOrCtrl', 'Ctrl');
}

type CommandResult<T> =
    Awaited<ReturnType<typeof commands.executeMenuCommand>> extends never
        ? never
        : { status: 'ok'; data: T } | { status: 'error'; error: { message: string } };
</script>

<template>
    <Menubar class="border-b">
        <MenubarMenu v-for="menu in menus" :key="menu.id">
            <MenubarTrigger>{{ menu.text }}</MenubarTrigger>
            <MenubarContent>
                <template v-for="item in menu.items" :key="item.id">
                    <MenubarSeparator v-if="item.type === 'separator'" />

                    <MenubarItem
                        v-else-if="item.type === 'item'"
                        :disabled="item.disabled"
                        @select="executeMenuCommand(item.id)"
                    >
                        {{ item.text }}
                        <MenubarShortcut v-if="item.shortcut">
                            {{ displayShortcut(item.shortcut) }}
                        </MenubarShortcut>
                    </MenubarItem>

                    <MenubarCheckboxItem
                        v-else-if="item.type === 'check'"
                        :disabled="item.disabled"
                        :model-value="item.checked"
                        @select="executeMenuCommand(item.id)"
                    >
                        {{ item.text }}
                        <MenubarShortcut v-if="item.shortcut">
                            {{ displayShortcut(item.shortcut) }}
                        </MenubarShortcut>
                    </MenubarCheckboxItem>

                    <MenubarSub v-else>
                        <MenubarSubTrigger>{{ item.text }}</MenubarSubTrigger>
                        <MenubarSubContent>
                            <template v-for="child in item.items" :key="child.id">
                                <MenubarSeparator v-if="child.type === 'separator'" />

                                <MenubarItem
                                    v-else-if="child.type === 'item'"
                                    :disabled="child.disabled"
                                    @select="executeMenuCommand(child.id)"
                                >
                                    {{ child.text }}
                                    <MenubarShortcut v-if="child.shortcut">
                                        {{ displayShortcut(child.shortcut) }}
                                    </MenubarShortcut>
                                </MenubarItem>

                                <MenubarCheckboxItem
                                    v-else-if="child.type === 'check'"
                                    :disabled="child.disabled"
                                    :model-value="child.checked"
                                    @select="executeMenuCommand(child.id)"
                                >
                                    {{ child.text }}
                                    <MenubarShortcut v-if="child.shortcut">
                                        {{ displayShortcut(child.shortcut) }}
                                    </MenubarShortcut>
                                </MenubarCheckboxItem>
                            </template>
                        </MenubarSubContent>
                    </MenubarSub>
                </template>
            </MenubarContent>
        </MenubarMenu>
    </Menubar>
</template>
