import tailwindcss from '@tailwindcss/vite';
import { defineConfig, mergeConfig } from 'vite';

import { createSharedConfig } from './vite.shared.config.ts';

export default mergeConfig(
    createSharedConfig(),
    defineConfig({
        plugins: [tailwindcss()],
        optimizeDeps: { entries: ['tests/ui/index.html'] },
        clearScreen: false,
        server: {
            warmup: { clientFiles: ['./tests/ui/main.ts', './src/main.ts'] },
            port: 1421,
            strictPort: true,
            host: '127.0.0.1',
            watch: {
                ignored: ['**/src-tauri/**', '**/.artifacts/**', '**/temp/**'],
            },
        },
    }),
);
