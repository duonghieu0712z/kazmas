import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        vueDevTools(),
        AutoImport({
            imports: ['vue'],
            dts: 'src/generated/auto-import.d.ts',
            vueTemplate: true,
        }),
        Components({
            dirs: ['src/components'],
            dts: 'src/generated/components.d.ts',
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('src', import.meta.url)),
        },
    },

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
});
