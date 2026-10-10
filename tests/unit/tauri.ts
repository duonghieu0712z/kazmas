import { vi } from 'vitest';

const tauri = vi.hoisted(() => ({
    getWorld: vi.fn(),
    getNode: vi.fn(),
    getManuscripts: vi.fn(),
    getWikis: vi.fn(),
    getTrash: vi.fn(),
    restoreNode: vi.fn(),
    restoreTrash: vi.fn(),
    purgeNode: vi.fn(),
    emptyTrash: vi.fn(),
    getDocument: vi.fn(),
    createManuscriptEntry: vi.fn(),
    createWikiEntry: vi.fn(),
    createFolder: vi.fn(),
    createWorld: vi.fn(),
    openWorld: vi.fn(),
    closeWorld: vi.fn(),
    updateDocument: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
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
vi.mock('@tauri-apps/api/app', () => ({ getName: async () => 'Kazmas' }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: tauri.open }));
vi.mock('@tauri-apps/plugin-os', () => ({ platform: () => 'windows' }));

export function resetTauri() {
    for (const mock of Object.values(tauri)) {
        mock.mockReset();
    }
    tauri.getWorld.mockResolvedValue({ status: 'ok', data: null });
    tauri.getNode.mockResolvedValue({ status: 'ok', data: null });
    tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [] });
    tauri.getWikis.mockResolvedValue({ status: 'ok', data: [] });
    tauri.getTrash.mockResolvedValue({ status: 'ok', data: [] });
    tauri.restoreNode.mockResolvedValue({ status: 'ok', data: true });
    tauri.restoreTrash.mockResolvedValue({ status: 'ok', data: true });
    tauri.purgeNode.mockResolvedValue({ status: 'ok', data: true });
    tauri.emptyTrash.mockResolvedValue({ status: 'ok', data: true });
    tauri.getDocument.mockResolvedValue({ status: 'ok', data: null });
    tauri.updateDocument.mockResolvedValue({ status: 'ok', data: true });
    tauri.updateNode.mockResolvedValue({ status: 'ok', data: true });
    tauri.deleteNode.mockResolvedValue({ status: 'ok', data: true });
    tauri.closeWorld.mockResolvedValue({ status: 'ok', data: null });
    tauri.executeMenuCommand.mockResolvedValue({ status: 'ok', data: null });
    tauri.listen.mockResolvedValue(tauri.unlisten);
}
