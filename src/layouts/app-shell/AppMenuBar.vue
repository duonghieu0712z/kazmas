<script setup lang="ts">
import { useAppMenu } from '@/composables/useAppMenu';
import AppMenuItem from '@/layouts/app-shell/AppMenuItem.vue';

const { menu, executeMenuCommand } = useAppMenu();
</script>

<template>
    <Menubar class="border-b">
        <MenubarMenu v-for="section in menu" :key="section.id">
            <MenubarTrigger>{{ section.text }}</MenubarTrigger>
            <MenubarContent>
                <AppMenuItem
                    v-for="item in section.items"
                    :key="item.id"
                    :item="item"
                    @select="executeMenuCommand"
                />
            </MenubarContent>
        </MenubarMenu>
    </Menubar>
</template>
