<script setup lang="ts">
import { useAppMenu } from '@/composables/use-app-menu';

import AppMenuItem from './AppMenuItem.vue';

const { menu, executeMenuCommand } = useAppMenu();
</script>

<template>
    <Menubar class="bg-title-bar-background">
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
