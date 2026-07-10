import { createGlobalState } from '@vueuse/core';
import { reactive, watchEffect } from 'vue';

import { createMenu, executeMenuCommand, setMenuItemEnabled } from '@/menus';
import { useWorldStore } from '@/stores/world';

function createAppMenu() {
    const world = useWorldStore();
    const menu = reactive(createMenu());

    watchEffect(() => {
        const hasProject = world.hasWorld;
        const hasTrash = false;
        const canCreateNode = world.hasWorld;

        setMenuItemEnabled(menu, 'save', hasProject);
        setMenuItemEnabled(menu, 'save-as', hasProject);
        setMenuItemEnabled(menu, 'close-world', hasProject);
        setMenuItemEnabled(menu, 'new-file', canCreateNode);
        setMenuItemEnabled(menu, 'new-folder', canCreateNode);
        setMenuItemEnabled(menu, 'project-settings', hasProject);
        setMenuItemEnabled(menu, 'empty-trash', hasProject && hasTrash);
    });

    return {
        menu,
        executeMenuCommand,
    };
}

export const useAppMenu = createGlobalState(createAppMenu);
