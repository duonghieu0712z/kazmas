import { useTimeoutFn } from '@vueuse/core';

type SaveDocument = (
    nodeId: string,
    content: string,
) => Promise<{ status: 'ok'; data: boolean | null } | { status: 'error'; error: unknown }>;

const flushers = new Set<() => Promise<void>>();

export async function flushDocumentSaves() {
    await Promise.all([...flushers].map((flush) => flush()));
}

export function createDocumentSaveQueue(
    save: SaveDocument,
    onError: (error: Error) => void,
    delay = 700,
) {
    const pending = new Map<string, string>();
    let running: Promise<void> | undefined;
    const { start, stop } = useTimeoutFn(
        async () => {
            try {
                await flush();
            } catch (error) {
                onError(error instanceof Error ? error : new Error(String(error)));
            }
        },
        delay,
        { immediate: false },
    );

    const drain = async () => {
        while (pending.size) {
            const entry = pending.entries().next().value;
            if (!entry) {
                return;
            }
            const [nodeId, content] = entry;
            const result = await save(nodeId, content);
            if (result.status !== 'ok' || result.data !== true) {
                throw new Error('Document could not be saved.');
            }
            if (pending.get(nodeId) === content) {
                pending.delete(nodeId);
            }
        }
    };

    const run = async () => {
        try {
            await drain();
        } finally {
            running = undefined;
        }
    };

    const flush = (): Promise<void> => {
        stop();
        running ??= run();
        return running;
    };

    const schedule = (nodeId: string, content: string) => {
        pending.set(nodeId, content);
        start();
    };

    const dispose = async () => {
        await flush();
        flushers.delete(flush);
    };

    flushers.add(flush);
    return { schedule, flush, dispose };
}
