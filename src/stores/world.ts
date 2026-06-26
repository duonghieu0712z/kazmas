import type { WorldManifestDto } from '@/generated/bindings';

import { defineStore } from 'pinia';

import { commands, events } from '@/generated/bindings';

export const useWorldStore = defineStore('world', () => {
    const manifest = shallowRef<WorldManifestDto | null>(null);
    const dirty = shallowRef(false);
    let initialized = false;

    const hasWorld = computed(() => manifest.value !== null);
    const isDirty = computed(() => dirty.value);
    const worldName = computed(() => manifest.value?.name ?? null);

    const setManifest = (value: WorldManifestDto) => {
        console.debug('World manifest set', value);
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

    const initWorld = async () => {
        if (initialized) {
            return;
        }
        initialized = true;

        await events.worldChanged.listen(({ payload }) => {
            dirty.value = payload;
        });
        await loadWorld();
    };

    return {
        manifest,
        isDirty,
        hasWorld,
        worldName,
        initWorld,
        setManifest,
        clearManifest,
    };
});
