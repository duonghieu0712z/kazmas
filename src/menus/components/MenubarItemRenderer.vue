<script setup lang="ts">
import type { MenuItem } from '../types';

import { formatShortcutText } from '@/utils/shortcut';

import { executeMenuCommand } from '../commands';

defineProps<{ item: MenuItem }>();
</script>

<template>
    <MenubarSeparator v-if="item.type === 'separator'" />

    <MenubarLabel v-else-if="item.type === 'label'" :inset="item.inset">
        {{ item.text }}
    </MenubarLabel>

    <MenubarItem
        v-else-if="item.type === 'item'"
        :disabled="item.enabled === false"
        :inset="item.inset"
        :variant="item.variant"
        @select="executeMenuCommand(item.command)"
    >
        <component :is="item.icon" v-if="item.icon" />
        {{ item.text }}
        <MenubarShortcut v-if="item.shortcut">
            {{ formatShortcutText(item.shortcut) }}
        </MenubarShortcut>
    </MenubarItem>

    <MenubarCheckboxItem
        v-else-if="item.type === 'check'"
        :disabled="item.enabled === false"
        :model-value="item.checked"
        @select="executeMenuCommand(item.command)"
    >
        <component :is="item.icon" v-if="item.icon" />
        {{ item.text }}
        <MenubarShortcut v-if="item.shortcut">
            {{ formatShortcutText(item.shortcut) }}
        </MenubarShortcut>
    </MenubarCheckboxItem>

    <MenubarRadioGroup v-else-if="item.type === 'radio-group'" :model-value="item.value">
        <MenubarRadioItem
            v-for="option in item.items"
            :key="option.id"
            :disabled="option.enabled === false"
            :value="option.value"
            @select="executeMenuCommand(option.command)"
        >
            <component :is="option.icon" v-if="option.icon" />
            {{ option.text }}
            <MenubarShortcut v-if="option.shortcut">
                {{ formatShortcutText(option.shortcut) }}
            </MenubarShortcut>
        </MenubarRadioItem>
    </MenubarRadioGroup>

    <MenubarSub v-else-if="item.type === 'submenu'">
        <MenubarSubTrigger :disabled="item.enabled === false" :inset="item.inset">
            <component :is="item.icon" v-if="item.icon" />
            {{ item.text }}
            <MenubarShortcut v-if="item.shortcut">
                {{ formatShortcutText(item.shortcut) }}
            </MenubarShortcut>
        </MenubarSubTrigger>
        <MenubarSubContent>
            <MenubarItemRenderer v-for="child in item.items" :key="child.id" :item="child" />
        </MenubarSubContent>
    </MenubarSub>
</template>
