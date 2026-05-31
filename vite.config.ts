import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
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

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
        watch: {
            // 3. tell Vite to ignore watching `src-tauri`
            ignored: ['**/src-tauri/**'],
        },
    },
}));
