import type { MenuCommand } from '@/generated/bindings';
import type { MenuItemIndex } from '@/menus';

import { createGlobalState } from '@vueuse/core';
import { reactive, watchEffect } from 'vue';

import { createMenu, createMenuIndex, executeMenuCommand } from '@/menus';
import { useWorldStore } from '@/stores/world';

export const useAppMenu = createGlobalState(createAppMenu);

function createAppMenu() {
    const world = useWorldStore();

    const menu = reactive(createMenu());
    const menuItems = createMenuIndex(menu);

    watchEffect(() => {
        const hasProject = world.hasWorld;
        const hasTrash = false;
        const canCreateNode = world.hasWorld;

        setMenuItemEnabled(menuItems, 'save', hasProject);
        setMenuItemEnabled(menuItems, 'save-as', hasProject);
        setMenuItemEnabled(menuItems, 'close-world', hasProject);
        setMenuItemEnabled(menuItems, 'new-file', canCreateNode);
        setMenuItemEnabled(menuItems, 'new-folder', canCreateNode);
        setMenuItemEnabled(menuItems, 'project-settings', hasProject);
        setMenuItemEnabled(menuItems, 'empty-trash', hasProject && hasTrash);
    });

    return {
        menu,
        executeMenuCommand,
    };
}

function setMenuItemEnabled(items: MenuItemIndex, id: MenuCommand, enabled: boolean) {
    const menuItem = items.get(id);
    if (menuItem) {
        menuItem.enabled = enabled;
    }
}
