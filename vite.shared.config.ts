import type { UserConfig } from 'vite';

import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';

export function createSharedConfig(generateDeclarations = false): UserConfig {
    return {
        plugins: [
            vue(),
            AutoImport({
                imports: ['vue'],
                dts: generateDeclarations ? 'src/generated/auto-import.d.ts' : false,
                vueTemplate: true,
            }),
            Components({
                dirs: ['src/components'],
                dts: generateDeclarations ? 'src/generated/components.d.ts' : false,
            }),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('src', import.meta.url)),
            },
        },
    };
}
