<script setup lang="ts">
import { useAppMenu } from '@/composables/useAppMenu';
import AppMenuItem from '@/layouts/app-shell/AppMenuItem.vue';

const { menus, executeMenuCommand } = useAppMenu();
</script>

<template>
    <Menubar class="border-b">
        <MenubarMenu v-for="menu in menus" :key="menu.id">
            <MenubarTrigger>{{ menu.text }}</MenubarTrigger>
            <MenubarContent>
                <AppMenuItem
                    v-for="item in menu.items"
                    :key="item.id"
                    :item="item"
                    @select="executeMenuCommand"
                />
            </MenubarContent>
        </MenubarMenu>
    </Menubar>
</template>
