import type { SidebarProps } from '.';
import type { ComputedRef, Ref } from 'vue';

import { createContext } from 'reka-ui';

export const SIDEBAR_WIDTH = '16rem';
export const SIDEBAR_WIDTH_MOBILE = '18rem';
export const SIDEBAR_WIDTH_ICON = '2.5rem';
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

export const [useSidebarLayout, provideSidebarLayoutContext] = createContext<{
    side: ComputedRef<SidebarProps['side'] | null>;
    collapsible: ComputedRef<SidebarProps['collapsible'] | null>;
}>('SidebarLayout');

export const [useSidebar, provideSidebarContext] = createContext<{
    state: ComputedRef<'expanded' | 'collapsed'>;
    open: Ref<boolean>;
    setOpen: (value: boolean) => void;
    isMobile: Ref<boolean>;
    openMobile: Ref<boolean>;
    setOpenMobile: (value: boolean) => void;
    toggleSidebar: () => void;
}>('Sidebar');
