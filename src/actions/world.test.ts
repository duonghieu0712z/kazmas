import type * as DialogModule from '@/providers/dialog';

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AlertDialogButtons, AlertDialogKind, AlertDialogResult } from '@/providers/dialog';
import { useWorldStore } from '@/stores/world';

import { manifest } from '../../tests/unit/fixtures';
import { tauri } from '../../tests/unit/tauri';
import { closeWorld, newWorld, openWorld } from './world';

const dialogs = vi.hoisted(() => ({
    save: vi.fn(),
    create: vi.fn(),
    placement: vi.fn(),
    flush: vi.fn(),
    error: vi.fn(),
}));
vi.mock('@/dialogs', () => ({
    openSaveWorldDialog: dialogs.save,
    openNewWorldDialog: dialogs.create,
    openWindowPlacementDialog: dialogs.placement,
}));
vi.mock('@/lib/document-saves', () => ({ flushDocumentSaves: dialogs.flush }));
vi.mock('@/providers/dialog', async (importOriginal) => ({
    ...(await importOriginal<typeof DialogModule>()),
    openAlertDialog: dialogs.error,
}));

describe('world actions', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        for (const mock of Object.values(dialogs)) {
            mock.mockReset();
        }
        dialogs.flush.mockResolvedValue(undefined);
        dialogs.placement.mockResolvedValue(AlertDialogResult.No);
    });

    it('waits for document writes before checking dirty state', async () => {
        const store = useWorldStore();
        store.setManifest(manifest());
        dialogs.flush.mockImplementation(async () => store.markDirty());
        dialogs.save.mockResolvedValue(AlertDialogResult.Cancel);
        await closeWorld();
        expect(dialogs.save).toHaveBeenCalledWith('world-a');
        expect(tauri.closeWorld).not.toHaveBeenCalled();
    });

    it.each([AlertDialogResult.Yes, AlertDialogResult.No, AlertDialogResult.Cancel])(
        'handles the unsaved changes choice %s',
        async (choice) => {
            const store = useWorldStore();
            store.setManifest(manifest());
            store.markDirty();
            dialogs.save.mockResolvedValue(choice);
            await closeWorld();
            expect(tauri.executeMenuCommand).toHaveBeenCalledTimes(
                choice === AlertDialogResult.Yes ? 1 : 0,
            );
            expect(tauri.closeWorld).toHaveBeenCalledTimes(
                choice === AlertDialogResult.Cancel ? 0 : 1,
            );
            expect(store.hasWorld).toBe(choice === AlertDialogResult.Cancel);
        },
    );

    it('does not close the world after a package save failure', async () => {
        const store = useWorldStore();
        store.setManifest(manifest());
        store.markDirty();
        dialogs.save.mockResolvedValue(AlertDialogResult.Yes);
        tauri.executeMenuCommand.mockResolvedValue({ status: 'error', error: 'disk full' });
        await closeWorld();
        expect(tauri.closeWorld).not.toHaveBeenCalled();
        expect(store.hasWorld).toBe(true);
    });

    it('reports failed document writes and cancels all world transitions', async () => {
        const store = useWorldStore();
        store.setManifest(manifest());
        dialogs.flush.mockRejectedValue(new Error('Write failed'));
        await newWorld();
        await openWorld();
        await closeWorld();
        expect(dialogs.error).toHaveBeenCalledTimes(3);
        expect(dialogs.error).toHaveBeenCalledWith({
            title: 'Document Save Failed',
            content: 'Write failed',
            kind: AlertDialogKind.Error,
            buttons: AlertDialogButtons.Ok,
        });
        expect(dialogs.save).not.toHaveBeenCalled();
        expect(dialogs.placement).not.toHaveBeenCalled();
        expect(dialogs.create).not.toHaveBeenCalled();
        expect(tauri.open).not.toHaveBeenCalled();
        expect(tauri.closeWorld).not.toHaveBeenCalled();
        expect(store.worldName).toBe('world-a');
    });

    it('creates a world and uses the returned manifest', async () => {
        dialogs.create.mockResolvedValue({ name: 'New', path: '/test' });
        tauri.createWorld.mockResolvedValue({ status: 'ok', data: manifest('new') });
        await newWorld();
        expect(tauri.createWorld).toHaveBeenCalledWith('New', '/test', false);
        expect(useWorldStore().worldName).toBe('new');
    });

    it('leaves the current world unchanged when opening in a new window', async () => {
        const store = useWorldStore();
        store.setManifest(manifest());
        dialogs.placement.mockResolvedValue(AlertDialogResult.Yes);
        tauri.open.mockResolvedValue('/test.kazmas');
        tauri.openWorld.mockResolvedValue({ status: 'ok', data: null });
        await openWorld();
        expect(tauri.openWorld).toHaveBeenCalledWith('/test.kazmas', true);
        expect(store.worldName).toBe('world-a');
    });

    it('cancels file selection and window placement without invoking commands', async () => {
        tauri.open.mockResolvedValue(null);
        await openWorld();
        expect(tauri.openWorld).not.toHaveBeenCalled();
        useWorldStore().setManifest(manifest());
        dialogs.placement.mockResolvedValue(AlertDialogResult.Cancel);
        await newWorld();
        expect(dialogs.create).not.toHaveBeenCalled();
    });

    it('keeps the existing manifest after open and close command failures', async () => {
        const store = useWorldStore();
        store.setManifest(manifest());
        tauri.open.mockResolvedValue('/corrupt.kazmas');
        tauri.openWorld.mockResolvedValue({ status: 'error', error: 'Invalid package' });
        tauri.closeWorld.mockResolvedValue({ status: 'error', error: 'Close failed' });
        await openWorld();
        await closeWorld();
        expect(store.worldName).toBe('world-a');
    });
});
