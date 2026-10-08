<script setup lang="ts">
import type { ContextMenuProviderEntry } from './use-context-menu-provider';

import { useEventListener } from '@vueuse/core';
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { executeMenuCommand } from '@/menus';
import { useDialogProvider } from '@/providers/dialog';
import { isMac } from '@/utils/platform';
import { parseShortcutKeys } from '@/utils/shortcut';

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
const reloadShortcut = parseShortcutKeys('mod+r').join(isMac() ? '' : '+');

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
    if (!interactedOutside && !activeDialog.value && target?.isConnected) {
        target.focus({ preventScroll: true });
    }
    renderedMenu.value = null;
}

onBeforeUnmount(() => closeContextMenu());
</script>

<template>
    <ContextMenu :open="isOpen" @update:open="updateOpen">
        <ContextMenuContent
            v-if="renderedMenu"
            aria-label="Context menu"
            :reference="reference"
            @close-auto-focus="restoreFocus"
            @interact-outside="handleInteractOutside"
        >
            <component
                :is="renderedMenu.component"
                v-if="renderedMenu.component"
                :key="renderedMenu.key"
                :payload="renderedMenu.payload"
                @close:context-menu="closeContextMenu(renderedMenu.key)"
            />

            <template v-if="isDevelopment">
                <ContextMenuSeparator v-if="renderedMenu.component" />
                <ContextMenuItem @select="executeMenuCommand('reload-window')">
                    Reload Window
                    <ContextMenuShortcut>{{ reloadShortcut }}</ContextMenuShortcut>
                </ContextMenuItem>
            </template>
        </ContextMenuContent>
    </ContextMenu>
</template>
