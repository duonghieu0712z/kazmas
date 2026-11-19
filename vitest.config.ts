import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import { createSharedConfig } from './vite.shared.config.ts';

export default mergeConfig(
    createSharedConfig(),
    defineConfig({
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
                exclude: ['**/*.test.ts', '**/index.ts', '**/.DS_Store'],
            },
        },
    }),
);
