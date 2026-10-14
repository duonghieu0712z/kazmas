import type { NodeTreeDto } from '@/stores/nodes';

import { useEventListener, useTimeoutFn } from '@vueuse/core';
import { defineStore } from 'pinia';

import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import { useNodeTreeActions } from './use-node-tree-actions';

type DropTarget =
    | { kind: 'content' | 'trash' }
    | { kind: 'tree'; id: string; placement: 'before' | 'after' | 'inside' };

export const useNodeDrag = defineStore('node-drag', () => {
    const nodes = useNodeStore();
    const world = useWorldStore();
    const actions = useNodeTreeActions(() => [...nodes.manuscripts, ...nodes.wikis]);

    const draggedId = ref<string>();
    const position = shallowRef({ x: 0, y: 0 });
    const target = shallowRef<DropTarget>();

    const draggedNode = computed(() =>
        draggedId.value ? nodes.getNode(draggedId.value) : undefined,
    );

    let pending:
        | {
              pointerId: number;
              nodeId: string;
              worldId: string;
              section: string | undefined;
              x: number;
              y: number;
              element: HTMLElement;
              expand: (id: string) => void;
          }
        | undefined;
    let suppressClick = false;

    let frame: number | undefined;
    let viewport: HTMLElement | undefined;
    let scrollSpeed = 0;

    const { start: startExpand, stop: stopExpand } = useTimeoutFn(
        () => {
            if (target.value?.kind === 'tree' && target.value.placement === 'inside') {
                pending?.expand(target.value.id);
            }
        },
        600,
        { immediate: false },
    );

    const setTarget = (value?: DropTarget) => {
        const current = target.value;

        if (
            current?.kind === value?.kind &&
            (value?.kind !== 'tree' ||
                (current?.kind === 'tree' &&
                    current.id === value.id &&
                    current.placement === value.placement))
        ) {
            return;
        }

        stopExpand();
        target.value = value;
        if (value?.kind === 'tree' && value.placement === 'inside') {
            startExpand();
        }
    };

    const validParent = (id: string) => {
        const visited = new Set<string>();
        let parent = nodes.getNode(id);

        while (parent) {
            if (parent.id === draggedId.value || visited.has(parent.id)) {
                return false;
            }

            visited.add(parent.id);
            parent = parent.parentId ? nodes.getNode(parent.parentId) : undefined;
        }

        return true;
    };

    const updateTarget = () => {
        viewport = undefined;
        scrollSpeed = 0;

        const element = document.elementFromPoint(position.value.x, position.value.y);
        if (!element || !draggedNode.value) {
            setTarget();
            return;
        }

        if (element.closest('[data-node-drop="trash"]')) {
            setTarget({ kind: 'trash' });
            return;
        }

        if (element.closest('[data-node-drop="content"]')) {
            const kind = draggedNode.value.kind;
            setTarget(
                kind === 'manuscript_entry' || kind === 'wiki_entry'
                    ? { kind: 'content' }
                    : undefined,
            );
            return;
        }

        const tree = element.closest<HTMLElement>(
            '[data-node-tree="Manuscript"][data-reorder="true"]',
        );
        if (!tree || pending?.section !== 'Manuscript') {
            setTarget();
            return;
        }

        viewport = tree.closest<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? undefined;
        if (viewport) {
            const bounds = viewport.getBoundingClientRect();

            if (position.value.y < bounds.top + 24) {
                scrollSpeed = -6;
            } else if (position.value.y > bounds.bottom - 24) {
                scrollSpeed = 6;
            }
        }

        const row = element.closest<HTMLElement>('[data-node-id]');
        const id = row?.dataset.nodeId;
        const node = id ? nodes.getNode(id) : undefined;
        if (!row || !node || node.id === draggedId.value) {
            const rootId = !row ? tree.dataset.rootId : undefined;
            setTarget(rootId ? { kind: 'tree', id: rootId, placement: 'inside' } : undefined);
            return;
        }

        const bounds = row.getBoundingClientRect();
        const fraction = (position.value.y - bounds.top) / bounds.height;
        let placement: 'before' | 'after' | 'inside' = fraction < 0.5 ? 'before' : 'after';

        if (node.kind === 'folder' && fraction > 0.25 && fraction < 0.75) {
            placement = 'inside';
        }

        const parentId = placement === 'inside' ? node.id : node.parentId;
        setTarget(
            parentId && validParent(parentId)
                ? { kind: 'tree', id: node.id, placement }
                : undefined,
        );
    };

    const autoScroll = () => {
        frame = undefined;
        if (!draggedId.value) {
            return;
        }

        if (viewport && scrollSpeed) {
            viewport.scrollTop += scrollSpeed;
            updateTarget();
        }

        frame = requestAnimationFrame(autoScroll);
    };

    const cancel = () => {
        if (draggedId.value) {
            suppressClick = true;
        }

        const pointer = pending;
        pending = undefined;
        draggedId.value = undefined;
        setTarget();
        viewport = undefined;
        scrollSpeed = 0;

        if (frame !== undefined) {
            cancelAnimationFrame(frame);
            frame = undefined;
        }

        if (pointer?.element.hasPointerCapture(pointer.pointerId)) {
            pointer.element.releasePointerCapture(pointer.pointerId);
        }
    };

    const begin = (event: PointerEvent, node: NodeTreeDto, expand: (id: string) => void) => {
        suppressClick = false;
        const element =
            event.currentTarget instanceof Element
                ? event.currentTarget.closest<HTMLElement>('[data-node-tree]')
                : null;
        if (
            actions.busy.value ||
            pending ||
            event.button !== 0 ||
            event.ctrlKey ||
            !event.isPrimary ||
            !(element instanceof HTMLElement) ||
            !world.manifest ||
            (event.target instanceof Element &&
                event.target.closest('input, button, .tree-chevron-icon'))
        ) {
            return;
        }

        pending = {
            pointerId: event.pointerId,
            nodeId: node.id,
            worldId: world.manifest.id,
            section: element.dataset.nodeTree,
            x: event.clientX,
            y: event.clientY,
            element,
            expand,
        };
    };

    useEventListener(
        document,
        'pointermove',
        (event) => {
            if (!pending || pending.pointerId !== event.pointerId) {
                return;
            }

            if (world.manifest?.id !== pending.worldId || !nodes.getNode(pending.nodeId)) {
                cancel();
                return;
            }

            position.value = { x: event.clientX, y: event.clientY };

            if (!draggedId.value) {
                if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) < 5) {
                    return;
                }

                draggedId.value = pending.nodeId;
                pending.element.setPointerCapture(event.pointerId);
                frame = requestAnimationFrame(autoScroll);
            }

            event.preventDefault();
            updateTarget();
        },
        { passive: false },
    );

    useEventListener(document, 'pointerup', async (event) => {
        if (!pending || event.pointerId !== pending.pointerId) {
            return;
        }

        const id = draggedId.value;
        const worldId = pending.worldId;
        const drop = target.value;

        cancel();
        if (!id || !drop || world.manifest?.id !== worldId) {
            return;
        }

        if (drop.kind === 'content') {
            actions.open(id);
        } else if (drop.kind === 'trash') {
            await actions.trash(id);
        } else if (drop.kind === 'tree') {
            await actions.move(id, drop.id, drop.placement);
        }
    });

    useEventListener(
        document,
        'click',
        (event) => {
            if (suppressClick && event.detail > 0) {
                event.preventDefault();
                event.stopImmediatePropagation();
                suppressClick = false;
            }
        },
        { capture: true },
    );
    useEventListener(
        document,
        'pointerdown',
        () => {
            suppressClick = false;
        },
        { capture: true },
    );

    useEventListener(document, 'keydown', (event) => {
        if (pending && event.key === 'Escape') {
            event.preventDefault();
            cancel();
        }
    });
    useEventListener(document, 'pointercancel', cancel);
    useEventListener(document, 'lostpointercapture', cancel);
    useEventListener(window, 'blur', cancel);

    watch(() => world.manifest?.id, cancel, { flush: 'sync' });
    onScopeDispose(cancel);

    return {
        draggedNode,
        draggedId,
        position,
        target,
        begin,
        cancel,
        busy: actions.busy,
        error: actions.error,
    };
});
