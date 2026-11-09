import tailwindcss from '@tailwindcss/vite';
import { defineConfig, mergeConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

import { createSharedConfig } from './vite.shared.config';

const host = process.env.TAURI_DEV_HOST;

export default mergeConfig(
    createSharedConfig(true),
    defineConfig({
        plugins: [tailwindcss(), vueDevTools()],
        clearScreen: false,
        server: {
            port: 1420,
            strictPort: true,
            host: host || false,
            hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
            watch: {
                ignored: ['**/src-tauri/**', '**/.artifacts/**'],
            },
        },
    }),
);
