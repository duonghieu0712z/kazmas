import { useLocalStorage } from '@vueuse/core';

interface SidebarPreferences {
    open: boolean;
    width: number;
}

export const sidebarPreferences = useLocalStorage<SidebarPreferences>(
    'sidebar_state',
    { open: true, width: 240 },
    { flush: 'sync' },
);
