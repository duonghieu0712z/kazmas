import { describe, expect, it, vi } from 'vitest';

import { deferred } from '../../tests/unit/fixtures';
import { tauri } from '../../tests/unit/tauri';
import { executeMenuCommand } from './commands';

const handlers = vi.hoisted(() => ({
    flush: vi.fn(),
    create: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    about: vi.fn(),
}));
vi.mock('@/lib/document-saves', () => ({ flushDocumentSaves: handlers.flush }));
vi.mock('@/actions/world', () => ({
    newWorld: handlers.create,
    openWorld: handlers.open,
    closeWorld: handlers.close,
}));
vi.mock('@/dialogs', () => ({ openAboutDialog: handlers.about }));

describe('menu command ordering', () => {
    it.each(['save', 'save-as', 'close-window', 'quit'] as const)(
        'waits for pending writes before %s',
        async (command) => {
            const pending = deferred<void>();
            handlers.flush.mockReturnValueOnce(pending.promise);
            const execution = executeMenuCommand(command);
            expect(tauri.executeMenuCommand).not.toHaveBeenCalled();
            pending.resolve();
            await execution;
            expect(tauri.executeMenuCommand).toHaveBeenCalledExactlyOnceWith(command);
        },
    );

    it('does not save the package when a document flush fails', async () => {
        handlers.flush.mockRejectedValueOnce(new Error('Write failed'));
        await expect(executeMenuCommand('save')).rejects.toThrow('Write failed');
        expect(tauri.executeMenuCommand).not.toHaveBeenCalled();
    });

    it('dispatches world commands to the frontend action', async () => {
        await executeMenuCommand('new-world');
        expect(handlers.create).toHaveBeenCalledTimes(1);
        expect(tauri.executeMenuCommand).not.toHaveBeenCalled();
    });
});
