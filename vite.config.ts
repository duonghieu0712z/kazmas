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
    const isDesktopTest = mode === 'test-desktop';
    const isTest = isUiTest || isDesktopTest;

    return {
        plugins: [
            vue(),
            tailwindcss(),
            !isUiTest && vueDevTools(),
            AutoImport({
                imports: ['vue'],
                dts: isTest ? false : 'src/generated/auto-import.d.ts',
                vueTemplate: true,
            }),
            Components({
                dirs: ['src/components'],
                dts: isTest ? false : 'src/generated/components.d.ts',
            }),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('src', import.meta.url)),
            },
        },

        optimizeDeps: isUiTest ? { entries: ['tests/ui/index.html'] } : undefined,
        build: isDesktopTest
            ? {
                  outDir: '.artifacts/desktop/frontend',
                  rolldownOptions: { input: 'tests/desktop/index.html' },
              }
            : undefined,
        clearScreen: false,
        server: {
            warmup: isUiTest ? { clientFiles: ['./tests/ui/main.ts', './src/main.ts'] } : undefined,
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
