<script setup lang="ts">
import type { MenuCommand, MenuItem } from '@/generated/bindings';

defineProps<{ item: MenuItem }>();

const emit = defineEmits<{ select: [command: MenuCommand] }>();

function displayShortcut(shortcut: string) {
    return shortcut.replace('CmdOrCtrl', 'Ctrl');
}
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
            {{ displayShortcut(item.shortcut) }}
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
            {{ displayShortcut(item.shortcut) }}
        </MenubarShortcut>
    </MenubarCheckboxItem>

    <MenubarSub v-else>
        <MenubarSubTrigger>{{ item.text }}</MenubarSubTrigger>
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
