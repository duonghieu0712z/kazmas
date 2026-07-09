import { createGlobalState } from '@vueuse/core';

import { appMenuSections } from '@/menus/appMenu';
import { runMenuCommand } from '@/menus/menuCommands';
import { useWorldStore } from '@/stores/world';

function createAppMenu() {
    const world = useWorldStore();
    const menus = computed(() => appMenuSections({ hasProject: world.hasWorld }));

    return {
        menus,
        executeMenuCommand: runMenuCommand,
    };
}

export const useAppMenu = createGlobalState(createAppMenu);
