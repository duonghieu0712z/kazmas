<script setup lang="ts">
import { useAppMenu } from '@/composables/use-app-menu';
import { MenubarItemRenderer } from '@/menus';

const { menu } = useAppMenu();
</script>

<template>
    <Menubar class="bg-title-bar-background">
        <MenubarMenu v-for="section in menu" :key="section.id">
            <MenubarTrigger>{{ section.text }}</MenubarTrigger>
            <MenubarContent>
                <MenubarItemRenderer v-for="item in section.items" :key="item.id" :item="item" />
            </MenubarContent>
        </MenubarMenu>
    </Menubar>
</template>
