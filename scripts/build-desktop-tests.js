import { spawnSync } from 'node:child_process';

const result = spawnSync(
    'pnpm',
    [
        'tauri',
        'build',
        '--debug',
        '--no-bundle',
        '--features',
        'desktop-tests',
        '--config',
        'src-tauri/tauri.test.conf.json',
    ],
    {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: process.platform === 'win32',
        windowsHide: true,
        env: { ...process.env, VITE_DESKTOP_TESTS: 'true' },
    },
);
process.exit(result.status ?? 1);
