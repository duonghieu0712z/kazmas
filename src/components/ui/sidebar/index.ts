import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'vue';

import { cva } from 'class-variance-authority';

export interface SidebarProps {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
    class?: HTMLAttributes['class'];
}

export { default as Sidebar } from './Sidebar.vue';
export { default as SidebarContent } from './SidebarContent.vue';
export { default as SidebarFooter } from './SidebarFooter.vue';
export { default as SidebarGroup } from './SidebarGroup.vue';
export { default as SidebarGroupAction } from './SidebarGroupAction.vue';
export { default as SidebarGroupContent } from './SidebarGroupContent.vue';
export { default as SidebarGroupLabel } from './SidebarGroupLabel.vue';
export { default as SidebarHeader } from './SidebarHeader.vue';
export { default as SidebarInput } from './SidebarInput.vue';
export { default as SidebarInset } from './SidebarInset.vue';
export { default as SidebarMenu } from './SidebarMenu.vue';
export { default as SidebarMenuAction } from './SidebarMenuAction.vue';
export { default as SidebarMenuBadge } from './SidebarMenuBadge.vue';
export { default as SidebarMenuButton } from './SidebarMenuButton.vue';
export { default as SidebarMenuItem } from './SidebarMenuItem.vue';
export { default as SidebarMenuSkeleton } from './SidebarMenuSkeleton.vue';
export { default as SidebarMenuSub } from './SidebarMenuSub.vue';
export { default as SidebarMenuSubButton } from './SidebarMenuSubButton.vue';
export { default as SidebarMenuSubItem } from './SidebarMenuSubItem.vue';
export { default as SidebarProvider } from './SidebarProvider.vue';
export { default as SidebarRail } from './SidebarRail.vue';
export { default as SidebarSeparator } from './SidebarSeparator.vue';
export { default as SidebarTrigger } from './SidebarTrigger.vue';
export { sidebarPreferences } from './storage';
export { useSidebar } from './utils';

export const sidebarGapVariants = cva(
    'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
    {
        variants: {
            side: {
                left: null,
                right: 'rotate-180',
            },
            variant: {
                sidebar: null,
                floating: null,
                inset: null,
            },
            collapsible: {
                offcanvas: null,
                icon: null,
                none: null,
            },
            state: {
                expanded: null,
                collapsed: null,
            },
        },
        compoundVariants: [
            {
                collapsible: 'offcanvas',
                state: 'collapsed',
                class: 'w-0',
            },
            {
                variant: 'sidebar',
                collapsible: 'icon',
                state: 'collapsed',
                class: 'w-(--sidebar-width-icon)',
            },
            {
                variant: ['floating', 'inset'],
                collapsible: 'icon',
                state: 'collapsed',
                class: 'w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]',
            },
        ],
    },
);

export const sidebarContainerVariants = cva(
    'fixed inset-y-0 z-20 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
    {
        variants: {
            side: {
                left: 'left-0',
                right: 'right-0',
            },
            variant: {
                sidebar: null,
                floating: 'p-2',
                inset: 'p-2',
            },
            collapsible: {
                offcanvas: null,
                icon: null,
                none: null,
            },
            state: {
                expanded: null,
                collapsed: null,
            },
        },
        compoundVariants: [
            {
                side: 'left',
                collapsible: 'offcanvas',
                state: 'collapsed',
                class: '-left-(--sidebar-width)',
            },
            {
                side: 'right',
                collapsible: 'offcanvas',
                state: 'collapsed',
                class: '-right-(--sidebar-width)',
            },
            {
                variant: 'sidebar',
                collapsible: 'icon',
                state: 'collapsed',
                class: 'w-(--sidebar-width-icon)',
            },
            {
                variant: ['floating', 'inset'],
                collapsible: 'icon',
                state: 'collapsed',
                class: 'w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]',
            },
            {
                variant: 'sidebar',
                side: 'left',
                class: 'border-r',
            },
            {
                variant: 'sidebar',
                side: 'right',
                class: 'border-l',
            },
        ],
    },
);

export const sidebarRailVariants = cva(
    [
        'absolute inset-y-0 z-30 hidden w-4 -translate-x-1/2 transition-all ease-linear sm:flex',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 hover:after:bg-border',
    ],
    {
        variants: {
            side: {
                left: '-right-4',
                right: 'left-0',
            },
            state: {
                expanded: null,
                collapsed: null,
            },
            collapsible: {
                offcanvas: 'translate-x-0 after:left-full hover:bg-background',
                icon: null,
                none: null,
            },
        },
        compoundVariants: [
            {
                side: 'left',
                state: 'expanded',
                class: 'cursor-w-resize',
            },
            {
                side: 'right',
                state: 'expanded',
                class: 'cursor-e-resize',
            },
            {
                side: 'left',
                state: 'collapsed',
                class: 'cursor-e-resize',
            },
            {
                side: 'right',
                state: 'collapsed',
                class: 'cursor-w-resize',
            },
            {
                side: 'left',
                collapsible: 'offcanvas',
                class: '-right-2',
            },
            {
                side: 'right',
                collapsible: 'offcanvas',
                class: '-left-2',
            },
        ],
    },
);

export const sidebarMenuButtonVariants = cva(
    [
        'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-sm p-2 text-left text-sm ring-focus-ring outline-hidden transition-[width,height,padding] focus-visible:ring-2 [&>span:last-child]:truncate',
        'hover:bg-hover hover:text-hover-foreground active:bg-active active:text-active-foreground',
        'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
        'data-[active=true]:bg-selected data-[active=true]:font-medium data-[active=true]:text-selected-foreground',
        'data-[state=open]:bg-selected data-[state=open]:text-selected-foreground',
        'group-has-data-[sidebar=menu-action]/menu-item:pr-8',
        `[&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4`,
    ],
    {
        variants: {
            variant: {
                default: 'hover:bg-hover hover:text-hover-foreground',
                outline:
                    'bg-background shadow-[0_0_0_1px_var(--border)] hover:bg-hover hover:text-hover-foreground',
            },
            size: {
                default: 'h-8',
                lg: 'h-12 group-data-[collapsible=icon]:p-0!',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export type SidebarMenuButtonVariants = VariantProps<typeof sidebarMenuButtonVariants>;
