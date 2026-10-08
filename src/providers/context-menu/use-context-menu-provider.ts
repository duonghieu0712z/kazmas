import { createGlobalState } from '@vueuse/core';
import { markRaw, shallowReadonly, shallowRef } from 'vue';

type ContextMenuComponent = new (...args: any[]) => { $props: any };

type ContextMenuPayload<TComponent extends ContextMenuComponent> =
    InstanceType<TComponent>['$props'] extends { payload: infer TPayload }
        ? { payload: TPayload }
        : InstanceType<TComponent>['$props'] extends { payload?: infer TPayload }
          ? { payload?: TPayload }
          : { payload?: never };

type ContextMenuOpenEntry<TComponent extends ContextMenuComponent> = {
    event: MouseEvent;
    component: TComponent;
} & ContextMenuPayload<TComponent>;

export type ContextMenuProviderEntry = {
    key: number;
    component?: ContextMenuComponent;
    payload?: unknown;
    position: { x: number; y: number };
    owner: HTMLElement | null;
    focusTarget: HTMLElement | null;
};

function createContextMenuProvider() {
    const activeContextMenu = shallowRef<ContextMenuProviderEntry | null>(null);
    let nextKey = 0;

    const openContextMenu = <TComponent extends ContextMenuComponent>(
        entry:
            | ContextMenuOpenEntry<TComponent>
            | { event: MouseEvent; component?: never; payload?: never },
    ) => {
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
            component: entry.component ? markRaw(entry.component) : undefined,
            payload: entry.payload,
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
