import { vi } from 'vitest';

const tauri = vi.hoisted(() => ({
    getWorld: vi.fn(),
    getManuscripts: vi.fn(),
    getWikis: vi.fn(),
    getDocument: vi.fn(),
    createWorld: vi.fn(),
    openWorld: vi.fn(),
    closeWorld: vi.fn(),
    updateDocument: vi.fn(),
    executeMenuCommand: vi.fn(),
    listen: vi.fn(),
    unlisten: vi.fn(),
    open: vi.fn(),
}));

export { tauri };

vi.mock('@/generated/bindings', () => ({
    commands: tauri,
    events: { worldChanged: () => ({ listen: tauri.listen }) },
    EXTENSION: 'kazmas',
    TITLE_BAR_HEIGHT: 32,
}));

vi.mock('@tauri-apps/api/webviewWindow', () => ({
    getCurrentWebviewWindow: () => ({ label: 'test-window' }),
}));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: tauri.open }));
vi.mock('@tauri-apps/plugin-os', () => ({ platform: () => 'windows' }));

export function resetTauri() {
    for (const mock of Object.values(tauri)) {
        mock.mockReset();
    }
    tauri.getWorld.mockResolvedValue({ status: 'ok', data: null });
    tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [] });
    tauri.getWikis.mockResolvedValue({ status: 'ok', data: [] });
    tauri.getDocument.mockResolvedValue({ status: 'ok', data: null });
    tauri.updateDocument.mockResolvedValue({ status: 'ok', data: true });
    tauri.closeWorld.mockResolvedValue({ status: 'ok', data: null });
    tauri.executeMenuCommand.mockResolvedValue({ status: 'ok', data: null });
    tauri.listen.mockResolvedValue(tauri.unlisten);
}
