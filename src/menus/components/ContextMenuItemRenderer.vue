<script setup lang="ts">
import type { MenuItem } from '../types';

import {
    ContextMenuSeparator,
    ContextMenuLabel,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuCheckboxItem,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
} from '@/components/ui/context-menu';
import { formatShortcutText } from '@/utils/shortcut';

import { executeMenuCommand } from '../commands';

defineProps<{ item: MenuItem }>();
</script>

<template>
    <ContextMenuSeparator v-if="item.type === 'separator'" />

    <ContextMenuLabel v-else-if="item.type === 'label'" :inset="item.inset">
        {{ item.text }}
    </ContextMenuLabel>

    <ContextMenuItem
        v-else-if="item.type === 'item'"
        :disabled="item.enabled === false"
        :inset="item.inset"
        :variant="item.variant"
        @select="executeMenuCommand(item.command)"
    >
        <component :is="item.icon" v-if="item.icon" />
        {{ item.text }}
        <ContextMenuShortcut v-if="item.shortcut">
            {{ formatShortcutText(item.shortcut) }}
        </ContextMenuShortcut>
    </ContextMenuItem>

    <ContextMenuCheckboxItem
        v-else-if="item.type === 'check'"
        :disabled="item.enabled === false"
        :model-value="item.checked"
        @select="executeMenuCommand(item.command)"
    >
        <component :is="item.icon" v-if="item.icon" />
        {{ item.text }}
        <ContextMenuShortcut v-if="item.shortcut">
            {{ formatShortcutText(item.shortcut) }}
        </ContextMenuShortcut>
    </ContextMenuCheckboxItem>

    <ContextMenuRadioGroup v-else-if="item.type === 'radio-group'" :model-value="item.value">
        <ContextMenuRadioItem
            v-for="option in item.items"
            :key="option.id"
            :disabled="option.enabled === false"
            :value="option.value"
            @select="executeMenuCommand(option.command)"
        >
            <component :is="option.icon" v-if="option.icon" />
            {{ option.text }}
            <ContextMenuShortcut v-if="option.shortcut">
                {{ formatShortcutText(option.shortcut) }}
            </ContextMenuShortcut>
        </ContextMenuRadioItem>
    </ContextMenuRadioGroup>

    <ContextMenuSub v-else-if="item.type === 'submenu'">
        <ContextMenuSubTrigger :disabled="item.enabled === false" :inset="item.inset">
            <component :is="item.icon" v-if="item.icon" />
            {{ item.text }}
            <ContextMenuShortcut v-if="item.shortcut">
                {{ formatShortcutText(item.shortcut) }}
            </ContextMenuShortcut>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
            <ContextMenuItemRenderer v-for="child in item.items" :key="child.id" :item="child" />
        </ContextMenuSubContent>
    </ContextMenuSub>
</template>
