import { afterEach, describe, expect, it, vi } from 'vitest';

import { deferred } from '../../tests/support/fixtures';
import { createDocumentSaveQueue, flushDocumentSaves } from './document-saves';

describe('document saves', () => {
    const queues: ReturnType<typeof createDocumentSaveQueue>[] = [];
    afterEach(async () => {
        await Promise.all(queues.splice(0).map((queue) => queue.dispose()));
    });

    const createQueue = (save = vi.fn().mockResolvedValue({ status: 'ok', data: true })) => {
        const queue = createDocumentSaveQueue(save, vi.fn());
        queues.push(queue);
        return { queue, save };
    };

    it('debounces repeated edits and writes only the newest content', async () => {
        vi.useFakeTimers();
        const { queue, save } = createQueue();
        queue.schedule('a', 'first');
        await vi.advanceTimersByTimeAsync(400);
        queue.schedule('a', 'last');
        await vi.advanceTimersByTimeAsync(699);
        expect(save).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(save).toHaveBeenCalledExactlyOnceWith('a', 'last');
    });

    it('flushes all documents before a world operation', async () => {
        const { queue, save } = createQueue();
        queue.schedule('a', 'A');
        queue.schedule('b', 'B');
        await flushDocumentSaves();
        expect(save.mock.calls).toEqual([
            ['a', 'A'],
            ['b', 'B'],
        ]);
    });

    it('waits for in-flight writes and serializes later edits', async () => {
        const pending = deferred<{ status: 'ok'; data: boolean }>();
        const save = vi
            .fn()
            .mockReturnValueOnce(pending.promise)
            .mockResolvedValue({ status: 'ok', data: true });
        const { queue } = createQueue(save);
        queue.schedule('a', 'old');
        const flushing = queue.flush();
        queue.schedule('a', 'new');
        pending.resolve({ status: 'ok', data: true });
        await flushing;
        expect(save.mock.calls).toEqual([
            ['a', 'old'],
            ['a', 'new'],
        ]);
    });

    it.each([
        { status: 'error', error: 'failed' },
        { status: 'ok', data: false },
    ])('retains unsaved content after a failed write: %j', async (failure) => {
        const save = vi
            .fn()
            .mockResolvedValueOnce(failure)
            .mockResolvedValue({ status: 'ok', data: true });
        const { queue } = createQueue(save);
        queue.schedule('a', 'content');
        await expect(queue.flush()).rejects.toThrow('Document could not be saved');
        await queue.flush();
        expect(save).toHaveBeenCalledTimes(2);
        expect(save).toHaveBeenLastCalledWith('a', 'content');
    });

    it('flushes and unregisters the queue on disposal', async () => {
        const { queue, save } = createQueue();
        queue.schedule('a', 'content');
        await queue.dispose();
        await flushDocumentSaves();
        expect(save).toHaveBeenCalledTimes(1);
    });
});
