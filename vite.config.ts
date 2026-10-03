import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => {
    const isUiTest = mode === 'test-ui';

    return {
        plugins: [
            vue(),
            tailwindcss(),
            ...(!isUiTest ? [vueDevTools()] : []),
            AutoImport({
                imports: ['vue'],
                dts: isUiTest ? false : 'src/generated/auto-import.d.ts',
                vueTemplate: true,
            }),
            Components({
                dirs: ['src/components'],
                dts: isUiTest ? false : 'src/generated/components.d.ts',
            }),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('src', import.meta.url)),
            },
        },

        optimizeDeps: isUiTest ? { entries: ['index.html'] } : undefined,
        clearScreen: false,
        server: {
            port: isUiTest ? 1421 : 1420,
            strictPort: true,
            host: isUiTest ? '127.0.0.1' : host || false,
            hmr: !isUiTest && host ? { protocol: 'ws', host, port: 1421 } : undefined,
            watch: {
                ignored: [
                    '**/src-tauri/**',
                    '**/.artifacts/**',
                    ...(isUiTest ? ['**/temp/**'] : []),
                ],
            },
        },
    };
});
