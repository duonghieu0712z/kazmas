import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        vue(),
        AutoImport({ imports: ['vue'], dts: false, vueTemplate: true }),
        Components({ dirs: ['src/components'], dts: false }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('src', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts', 'tests/desktop/**/*.test.ts'],
        setupFiles: ['tests/unit/setup.ts'],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            reportsDirectory: '.artifacts/coverage',
            reporter: ['text', 'html', 'lcov'],
            include: [
                'src/stores/**',
                'src/actions/**',
                'src/menus/**',
                'src/dialogs/**',
                'src/providers/**',
                'src/features/**',
                'src/extensions/tiptap/**',
                'src/lib/document-saves.ts',
            ],
            exclude: ['**/*.test.ts', '**/index.ts'],
        },
    },
});
