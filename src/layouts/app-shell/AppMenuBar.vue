<script setup lang="ts">
import type { MenuCommand, MenuGroup } from '@/generated/bindings';

import AboutDialog from '@/dialogs/AboutDialog.vue';
import { commands } from '@/generated/bindings';
import { useDialogProvider } from '@/providers/dialog';

const menus = ref<MenuGroup[]>([]);
const { openDialog } = useDialogProvider();

onMounted(async () => {
    menus.value = await commands.getAppMenu();
});

async function executeMenuCommand(command: MenuCommand) {
    if (command === 'about') {
        await openDialog({
            component: AboutDialog,
        });
        return;
    }

    await commands.executeMenuCommand(command);
}

function displayShortcut(shortcut: string) {
    return shortcut.replace('CmdOrCtrl', 'Ctrl');
}
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
