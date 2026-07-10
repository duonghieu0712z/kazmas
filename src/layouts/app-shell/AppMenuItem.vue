<script setup lang="ts">
import type { MenuCommand } from '@/generated/bindings';
import type { MenuItem } from '@/menus';

defineProps<{ item: MenuItem }>();

const emit = defineEmits<{ select: [command: MenuCommand] }>();
</script>

<template>
    <MenubarSeparator v-if="item.type === 'separator'" />

    <MenubarItem
        v-else-if="item.type === 'item'"
        :disabled="!item.enabled"
        @select="emit('select', item.id)"
    >
        {{ item.text }}
        <MenubarShortcut v-if="item.shortcut">
            {{ item.shortcut }}
        </MenubarShortcut>
    </MenubarItem>

    <MenubarCheckboxItem
        v-else-if="item.type === 'check'"
        :disabled="!item.enabled"
        :model-value="item.checked"
        @select="emit('select', item.id)"
    >
        {{ item.text }}
        <MenubarShortcut v-if="item.shortcut">
            {{ item.shortcut }}
        </MenubarShortcut>
    </MenubarCheckboxItem>

    <MenubarSub v-else-if="item.type === 'submenu'">
        <MenubarSubTrigger :disabled="!item.enabled">{{ item.text }}</MenubarSubTrigger>
        <MenubarSubContent>
            <AppMenuItem
                v-for="child in item.items"
                :key="child.id"
                :item="child"
                @select="emit('select', $event)"
            />
        </MenubarSubContent>
    </MenubarSub>
</template>
