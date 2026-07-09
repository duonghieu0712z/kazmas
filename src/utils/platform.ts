import { platform } from '@tauri-apps/plugin-os';

export function isMac() {
    return platform() === 'macos';
}
