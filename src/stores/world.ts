import type { WorldManifestDto } from '@/generated/bindings';

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { defineStore } from 'pinia';

import { commands, events } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';

export const useWorldStore = defineStore('world', () => {
    const manifest = shallowRef<WorldManifestDto | null>(null);
    const dirty = shallowRef(false);

    let initialization: Promise<void> | undefined;
    let stopListening: (() => void) | undefined;
    onScopeDispose(() => stopListening?.());

    const hasWorld = computed(() => manifest.value !== null);
    const isDirty = computed(() => dirty.value);
    const worldName = computed(() => manifest.value?.name ?? null);

    const nodes = useNodeStore();

    watch(
        () => manifest.value?.id,
        async (value) => {
            nodes.clearNodes();
            if (value) {
                await nodes.reloadNodes();
                return;
            }
        },
    );

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

    return {
        manifest,
        isDirty,
        hasWorld,
        worldName,
        initWorld,
        setManifest,
        clearManifest,
        markDirty,
    };
});
