import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function run(args) {
    const result = spawnSync('pnpm', args, {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: process.platform === 'win32',
        windowsHide: true,
    });
    return result.status ?? 1;
}

if (process.argv.includes('--frontend-only')) {
    const status = run(['build', '--mode', 'test-desktop']);
    if (status === 0) {
        copyFileSync(
            '.artifacts/desktop/frontend/tests/desktop/index.html',
            '.artifacts/desktop/frontend/index.html',
        );
    }
    process.exit(status);
}

const status = run([
    'tauri',
    'build',
    '--debug',
    '--no-bundle',
    '--features',
    'desktop-tests',
    '--config',
    'src-tauri/tauri.test.conf.json',
]);
if (status === 0) {
    const binaryName = `kazmas${process.platform === 'win32' ? '.exe' : ''}`;
    const targetDirectory = process.env.CARGO_TARGET_DIR
        ? resolve('src-tauri', process.env.CARGO_TARGET_DIR)
        : resolve('src-tauri/target');
    mkdirSync('.artifacts/desktop/bin', { recursive: true });
    copyFileSync(
        resolve(targetDirectory, 'debug', binaryName),
        resolve('.artifacts/desktop/bin', binaryName),
    );
}
process.exit(status);
