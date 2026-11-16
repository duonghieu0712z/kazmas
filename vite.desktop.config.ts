import tailwindcss from '@tailwindcss/vite';
import { defineConfig, mergeConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

import { createSharedConfig } from './vite.shared.config.ts';

export default mergeConfig(
    createSharedConfig(),
    defineConfig({
        plugins: [tailwindcss(), vueDevTools()],
        clearScreen: false,
        build: {
            outDir: '.artifacts/desktop/frontend',
            rolldownOptions: { input: 'tests/desktop/index.html' },
        },
    }),
);
