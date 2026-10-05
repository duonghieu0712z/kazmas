<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

import { ImagesIcon, LibraryIcon, ScrollTextIcon, SettingsIcon, Trash2Icon } from '@lucide/vue';

import { useSidebar } from '@/components/ui/sidebar';

export type ActivityBarItemName = 'Manuscript' | 'Wiki' | 'Assets' | 'Trash' | 'Settings';

type ItemType = { name: ActivityBarItemName; icon: LucideIcon };

const props = defineProps<{
    modelValue: ActivityBarItemName | null;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: ActivityBarItemName | null];
}>();

const ITEMS = [
    {
        name: 'Manuscript',
        icon: ScrollTextIcon,
    },
    {
        name: 'Wiki',
        icon: LibraryIcon,
    },
    {
        name: 'Assets',
        icon: ImagesIcon,
    },
    {
        name: 'Trash',
        icon: Trash2Icon,
    },
] satisfies ItemType[];

const FOOTERS = [
    {
        name: 'Settings',
        icon: SettingsIcon,
    },
] satisfies ItemType[];

const { open, setOpen } = useSidebar();

function selectItem(item: ItemType) {
    if (open.value && props.modelValue === item.name) {
        setOpen(false);
        return;
    }

    emit('update:modelValue', item.name);
    setOpen(true);
}

onMounted(() => {
    if (open.value && !props.modelValue) {
        emit('update:modelValue', ITEMS[0]!.name);
    }
});
</script>

<template>
    <Sidebar
        class="w-[calc(var(--sidebar-width-icon)+1px)] border-y border-r bg-background text-foreground"
        :class="open ? 'border-y-transparent' : 'border-transparent'"
        collapsible="none"
    >
        <SidebarContent>
            <SidebarMenu class="gap-0">
                <SidebarMenuItem
                    v-for="item in ITEMS"
                    :key="item.name"
                    class="flex h-(--sidebar-width-icon) w-full items-center justify-center"
                >
                    <SidebarMenuButton
                        always-show-tooltip
                        :class="[
                            'size-8 justify-center p-0 hover:bg-transparent active:bg-transparent',
                            '[&>svg]:stroke-muted-foreground hover:[&>svg]:stroke-foreground active:[&>svg]:stroke-foreground data-[active=true]:[&>svg]:stroke-foreground',
                        ]"
                        :is-active="open && modelValue === item.name"
                        :tooltip="item.name"
                        @click="selectItem(item)"
                    >
                        <component :is="item.icon" />
                        <span class="sr-only">{{ item.name }}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>

        <SidebarFooter class="gap-0 p-0">
            <SidebarMenu class="gap-0">
                <SidebarMenuItem
                    v-for="item in FOOTERS"
                    :key="item.name"
                    class="flex h-(--sidebar-width-icon) w-full items-center justify-center"
                >
                    <SidebarMenuButton
                        always-show-tooltip
                        :class="[
                            'size-8 justify-center p-0 hover:bg-transparent active:bg-transparent',
                            '[&>svg]:stroke-muted-foreground hover:[&>svg]:stroke-foreground active:[&>svg]:stroke-foreground data-[active=true]:[&>svg]:stroke-foreground',
                        ]"
                        :tooltip="item.name"
                    >
                        <component :is="item.icon" />
                        <span class="sr-only">{{ item.name }}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
</template>
