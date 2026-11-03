import { createGlobalState, useAsyncState } from '@vueuse/core';

import { commands } from '@/generated/bindings';

export const useSystemFonts = createGlobalState(() => {
    const loaded = ref(false);

    const { state, isLoading, error, execute } = useAsyncState(
        async () => {
            const result = await commands.getSystemFonts();

            if (result.status === 'error') {
                throw new Error(result.error.message);
            }

            return result.data;
        },
        [] as string[],
        { immediate: false, resetOnExecute: false },
    );

    const loadFonts = async () => {
        if (loaded.value || isLoading.value) {
            return;
        }

        await execute();
        loaded.value = !error.value;
    };

    return { fonts: state, isLoading, error, loadFonts };
});
