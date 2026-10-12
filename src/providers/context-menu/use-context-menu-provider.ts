import type { MenuItem } from '@/menus';
import type { MaybeRefOrGetter } from 'vue';

import { createGlobalState } from '@vueuse/core';
import { shallowReadonly, shallowRef } from 'vue';

export type ContextMenuOpenEntry = {
    event: MouseEvent;
    items?: MaybeRefOrGetter<readonly MenuItem[]>;
};

export type ContextMenuProviderEntry = {
    key: number;
    items: MaybeRefOrGetter<readonly MenuItem[]>;
    position: { x: number; y: number };
    owner: HTMLElement | null;
    focusTarget: HTMLElement | null;
};

function createContextMenuProvider() {
    const activeContextMenu = shallowRef<ContextMenuProviderEntry | null>(null);
    let nextKey = 0;

    const openContextMenu = (entry: ContextMenuOpenEntry) => {
        const { event } = entry;
        event.preventDefault();
        event.stopPropagation();

        const owner =
            event.currentTarget instanceof HTMLElement
                ? event.currentTarget
                : event.target instanceof HTMLElement
                  ? event.target
                  : null;
        const focused = document.activeElement;
        const focusTarget =
            activeContextMenu.value?.focusTarget ??
            (focused instanceof HTMLElement && focused !== document.body ? focused : owner);
        const bounds = owner?.getBoundingClientRect();
        const position =
            event.button === 0 && event.clientX === 0 && event.clientY === 0 && bounds
                ? { x: bounds.left, y: bounds.bottom }
                : { x: event.clientX, y: event.clientY };

        activeContextMenu.value = {
            key: ++nextKey,
            items: entry.items ?? [],
            position,
            owner,
            focusTarget,
        };
    };

    const closeContextMenu = (key = activeContextMenu.value?.key) => {
        if (activeContextMenu.value?.key === key) {
            activeContextMenu.value = null;
        }
    };

    return {
        activeContextMenu: shallowReadonly(activeContextMenu),
        openContextMenu,
        closeContextMenu,
    };
}

export const useContextMenuProvider = createGlobalState(createContextMenuProvider);
