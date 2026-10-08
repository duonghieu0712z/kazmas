<script setup lang="ts">
import type { ContextMenuProviderEntry } from './use-context-menu-provider';

import { useEventListener } from '@vueuse/core';
import { computed, onBeforeUnmount, shallowRef, toValue, watch } from 'vue';

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { ContextMenuItemRenderer, createCommandMenuItem } from '@/menus';
import { useDialogProvider } from '@/providers/dialog';

import { useContextMenuProvider } from './use-context-menu-provider';

const { activeContextMenu, openContextMenu, closeContextMenu } = useContextMenuProvider();
const { activeDialog } = useDialogProvider();

const renderedMenu = shallowRef<ContextMenuProviderEntry | null>(null);

const isOpen = computed(() => activeContextMenu.value !== null);
const reference = computed(() => {
    const entry = renderedMenu.value;
    return {
        contextElement: entry?.owner ?? undefined,
        getBoundingClientRect: () =>
            new DOMRect(entry?.position.x ?? 0, entry?.position.y ?? 0, 0, 0),
    };
});

let interactedOutside = false;
const isDevelopment = import.meta.env.DEV;
const reloadItem = createCommandMenuItem('reload-window');
const items = computed(() => toValue(renderedMenu.value?.items) ?? []);

if (isDevelopment) {
    useEventListener(document, 'contextmenu', (event) => {
        if (!event.defaultPrevented) {
            openContextMenu({ event });
        }
    });
}

watch(
    activeContextMenu,
    (entry) => {
        if (entry) {
            renderedMenu.value = entry;
            interactedOutside = false;
        }
    },
    { immediate: true, flush: 'sync' },
);

watch(activeDialog, (entry) => {
    if (entry) {
        closeContextMenu();
    }
});

function updateOpen(open: boolean) {
    if (!open) {
        closeContextMenu();
    }
}

function handleInteractOutside() {
    interactedOutside = true;
}

function restoreFocus(event: Event) {
    event.preventDefault();
    if (activeContextMenu.value) {
        return;
    }

    const target = renderedMenu.value?.focusTarget;
    const focused = document.activeElement;
    const focusMovedOutside =
        focused instanceof HTMLElement &&
        focused !== document.body &&
        !(event.target instanceof HTMLElement && event.target.contains(focused));
    if (!interactedOutside && !activeDialog.value && !focusMovedOutside && target?.isConnected) {
        target.focus({ preventScroll: true });
    }
    renderedMenu.value = null;
}

onBeforeUnmount(() => closeContextMenu());
</script>

<template>
    <ContextMenu :modal="false" :open="isOpen" @update:open="updateOpen">
        <ContextMenuContent
            v-if="renderedMenu"
            aria-label="Context menu"
            :reference="reference"
            @close-auto-focus="restoreFocus"
            @interact-outside="handleInteractOutside"
        >
            <ContextMenuItemRenderer
                v-for="item in items"
                :key="`${renderedMenu.key}:${item.id}`"
                :item="item"
            />

            <template v-if="isDevelopment">
                <ContextMenuSeparator v-if="items.length" />
                <ContextMenuItemRenderer :item="reloadItem" />
            </template>
        </ContextMenuContent>
    </ContextMenu>
</template>
