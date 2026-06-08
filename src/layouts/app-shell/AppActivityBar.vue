<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

import { LibraryIcon, ScrollTextIcon } from '@lucide/vue';

import { useSidebar } from '@/components/ui/sidebar';

const ITEMS = [
    {
        name: 'Manuscript',
        icon: ScrollTextIcon,
    },
    {
        name: 'Wiki',
        icon: LibraryIcon,
    },
];

const activeItem = ref(ITEMS[0]);
const { open, setOpen } = useSidebar();

function selectItem(item: { name: string; icon: LucideIcon }) {
    if (open.value && activeItem.value?.name === item.name) {
        activeItem.value = undefined;
        setOpen(false);
        return;
    }

    activeItem.value = item;
    setOpen(true);
}
</script>

<template>
    <Sidebar
        class="bg-background text-foreground w-(--sidebar-width-icon)! items-center border-r"
        collapsible="none"
    >
        <SidebarContent>
            <SidebarMenu class="items-center gap-0">
                <SidebarMenuItem
                    v-for="item in ITEMS"
                    :key="item.name"
                    class="flex size-(--sidebar-width-icon) items-center justify-center"
                >
                    <SidebarMenuButton
                        always-show-tooltip
                        :class="[
                            'size-8 justify-center p-0 hover:bg-transparent active:bg-transparent',
                            'hover:[&>svg]:stroke-sidebar-accent-foreground active:[&>svg]:stroke-accent-foreground data-[active=true]:[&>svg]:stroke-accent-foreground [&>svg]:stroke-sidebar-ring',
                        ]"
                        :is-active="activeItem?.name === item.name"
                        :tooltip="item.name"
                        @click="selectItem(item)"
                    >
                        <component :is="item.icon" />
                        <span class="sr-only">{{ item.name }}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
    </Sidebar>
</template>
