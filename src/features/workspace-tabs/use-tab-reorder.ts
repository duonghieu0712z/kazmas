import type { WorkspaceTab } from '.';
import type { ComputedRef } from 'vue';

import { useEventListener } from '@vueuse/core';

interface TabReorderOptions {
    tabs: () => WorkspaceTab[];
    list: ComputedRef<HTMLElement | null | undefined>;
    viewport: ComputedRef<HTMLElement | null | undefined>;
    select: (id: string) => void;
    move: (id: string, index: number) => void;
}

export function useTabReorder(options: TabReorderOptions) {
    const draggedId = ref<string>();
    const dragPosition = shallowRef({ x: 0, y: 0 });
    const dropTarget = ref<{ id: string; side: 'before' | 'after' }>();
    let pointer: { id: number; tabId: string; startX: number; startY: number } | undefined;
    let dropIndex: number | undefined;
    let scrollSpeed = 0;
    let frame: number | undefined;
    let suppressClick = false;

    const getTab = (event: MouseEvent | PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Element) || target.closest('button')) {
            return;
        }
        return target.closest<HTMLElement>('[role="tab"][data-tab-id]') ?? undefined;
    };

    const updateTarget = () => {
        const viewport = options.viewport.value;
        const list = options.list.value;
        dropTarget.value = undefined;
        dropIndex = undefined;
        scrollSpeed = 0;
        if (!viewport || !list || !draggedId.value) {
            return;
        }

        const bounds = viewport.getBoundingClientRect();
        const remaining = [
            ...list.querySelectorAll<HTMLElement>('[role="tab"][data-tab-id]'),
        ].filter((tab) => tab.dataset.tabId !== draggedId.value);
        const before = remaining.findIndex((tab) => {
            const rect = tab.getBoundingClientRect();
            return dragPosition.value.x < rect.left + rect.width / 2;
        });
        dropIndex = before < 0 ? remaining.length : before;
        const currentIndex = options.tabs().findIndex((tab) => tab.id === draggedId.value);
        if (dropIndex !== currentIndex) {
            const target = remaining[dropIndex] ?? remaining.at(-1);
            if (target?.dataset.tabId) {
                dropTarget.value = {
                    id: target.dataset.tabId,
                    side: before < 0 ? 'after' : 'before',
                };
            }
        }

        const { x, y } = dragPosition.value;
        if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
            return;
        }

        if (x < bounds.left + 32 && viewport.scrollLeft > 0) {
            scrollSpeed = -10;
        } else if (
            x > bounds.right - 32 &&
            viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth
        ) {
            scrollSpeed = 10;
        }
    };

    const autoScroll = () => {
        frame = undefined;
        if (!draggedId.value || !options.viewport.value || !scrollSpeed) {
            return;
        }
        options.viewport.value.scrollLeft += scrollSpeed;
        updateTarget();
        frame = requestAnimationFrame(autoScroll);
    };

    const finish = () => {
        if (frame !== undefined) {
            cancelAnimationFrame(frame);
            frame = undefined;
        }
        const list = options.list.value;
        if (pointer && list?.hasPointerCapture(pointer.id)) {
            list.releasePointerCapture(pointer.id);
        }
        if (draggedId.value) {
            suppressClick = true;
        }
        pointer = undefined;
        draggedId.value = undefined;
        dropTarget.value = undefined;
        dropIndex = undefined;
        scrollSpeed = 0;
    };

    useEventListener(
        options.list,
        'pointerdown',
        (event) => {
            suppressClick = false;
            if (event.button !== 0 || event.ctrlKey || !event.isPrimary) {
                return;
            }
            const tab = getTab(event);
            if (tab?.dataset.tabId) {
                pointer = {
                    id: event.pointerId,
                    tabId: tab.dataset.tabId,
                    startX: event.clientX,
                    startY: event.clientY,
                };
            }
        },
        { capture: true },
    );

    // Defer pointer selection until click so dragging an inactive tab does not activate it.
    useEventListener(
        options.list,
        'mousedown',
        (event) => {
            if (event.button === 0 && !event.ctrlKey && getTab(event)) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        { capture: true },
    );

    useEventListener(
        document,
        'pointermove',
        (event) => {
            if (!pointer || event.pointerId !== pointer.id) {
                return;
            }
            dragPosition.value = { x: event.clientX, y: event.clientY };
            if (!draggedId.value) {
                if (
                    Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) < 5
                ) {
                    return;
                }
                draggedId.value = pointer.tabId;
                options.list.value?.setPointerCapture(pointer.id);
            }
            event.preventDefault();
            updateTarget();
            if (scrollSpeed && frame === undefined) {
                frame = requestAnimationFrame(autoScroll);
            }
        },
        { passive: false },
    );

    useEventListener(document, 'pointerup', (event) => {
        if (!pointer || event.pointerId !== pointer.id) {
            return;
        }
        if (draggedId.value && dropIndex !== undefined) {
            options.move(draggedId.value, dropIndex);
        }
        finish();
    });
    useEventListener(document, 'pointercancel', finish);
    useEventListener(options.list, 'lostpointercapture', finish);
    useEventListener(window, 'blur', finish);
    useEventListener(document, 'keydown', (event) => {
        if (pointer && event.key === 'Escape') {
            event.preventDefault();
            finish();
        }
    });
    useEventListener(
        options.list,
        'click',
        (event) => {
            if (suppressClick && event.detail > 0) {
                event.preventDefault();
                event.stopPropagation();
                suppressClick = false;
                return;
            }
            const tab = getTab(event);
            if (event.button === 0 && !event.ctrlKey && tab?.dataset.tabId) {
                options.select(tab.dataset.tabId);
                tab.focus();
            }
        },
        { capture: true },
    );

    watch(options.tabs, () => {
        if (pointer && !options.tabs().some((tab) => tab.id === pointer?.tabId)) {
            finish();
        }
    });
    onScopeDispose(finish);

    return { draggedId, dragPosition, dropTarget };
}
