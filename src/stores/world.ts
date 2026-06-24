import type { WorldManifestDto } from '@/generated/bindings';

import { defineStore } from 'pinia';

export const useWorldStore = defineStore('world', () => {
    const manifest = shallowRef<WorldManifestDto | null>(null);

    const hasWorld = computed(() => manifest.value !== null);
    const worldName = computed(() => manifest.value?.name ?? null);

    const setManifest = (value: WorldManifestDto) => {
        console.debug('World manifest set', value);
        manifest.value = value;
    };

    const clearManifest = () => {
        manifest.value = null;
    };

    return {
        manifest,
        hasWorld,
        worldName,
        setManifest,
        clearManifest,
    };
});
