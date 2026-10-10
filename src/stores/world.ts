import type { WorldManifestDto } from '@/generated/bindings';

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { defineStore } from 'pinia';

import { commands, events } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';
import { useWorkspaceStore } from '@/stores/workspace';

export const useWorldStore = defineStore('world', () => {
    const manifest = shallowRef<WorldManifestDto | null>(null);
    const dirty = shallowRef(false);
    const pendingCreations = new Set<Promise<unknown>>();

    let initialization: Promise<void> | undefined;
    let stopListening: (() => void) | undefined;
    onScopeDispose(() => stopListening?.());

    const hasWorld = computed(() => manifest.value !== null);
    const isDirty = computed(() => dirty.value);
    const worldName = computed(() => manifest.value?.name ?? null);

    const nodes = useNodeStore();
    const workspace = useWorkspaceStore();
    let nodeReload: Promise<unknown> = Promise.resolve();

    watch(
        () => manifest.value?.id,
        async (value) => {
            nodes.clearNodes();
            const reload = value ? nodes.reloadNodes() : Promise.resolve();
            nodeReload = reload;
            if (value) {
                await reload;
                if (nodeReload === reload && manifest.value?.id === value) {
                    workspace.restoreWorld(value, (nodeId) => {
                        const kind = nodes.getNode(nodeId)?.kind;
                        return kind === 'manuscript_entry' || kind === 'wiki_entry';
                    });
                }
                return;
            }
        },
    );

    const waitForNodes = async () => {
        await nextTick();
        await nodeReload;
    };

    const setManifest = (value: WorldManifestDto) => {
        manifest.value = value;
        dirty.value = false;
    };

    const clearManifest = () => {
        manifest.value = null;
        dirty.value = false;
    };

    const loadWorld = async () => {
        const result = await commands.getWorld();
        if (result.status !== 'ok') {
            return;
        }

        if (result.data) {
            setManifest(result.data);
        } else {
            clearManifest();
        }
    };

    const initialize = async () => {
        let unlisten: (() => void) | undefined;
        try {
            const window = getCurrentWebviewWindow();
            unlisten = await events.worldChanged(window).listen(({ payload }) => {
                dirty.value = payload;
            });
            await loadWorld();
            stopListening = unlisten;
        } catch (error) {
            unlisten?.();
            initialization = undefined;
            throw error;
        }
    };

    const initWorld = () => {
        initialization ??= initialize();
        return initialization;
    };

    const markDirty = () => {
        dirty.value = true;
    };

    const trackCreation = <T>(creation: Promise<T>): Promise<T> => {
        const pending = creation.finally(() => pendingCreations.delete(pending));
        pendingCreations.add(pending);
        return pending;
    };

    const waitForCreations = async () => {
        while (pendingCreations.size) {
            await Promise.allSettled([...pendingCreations]);
        }
    };

    return {
        manifest,
        isDirty,
        hasWorld,
        worldName,
        initWorld,
        setManifest,
        clearManifest,
        waitForNodes,
        markDirty,
        trackCreation,
        waitForCreations,
    };
});
