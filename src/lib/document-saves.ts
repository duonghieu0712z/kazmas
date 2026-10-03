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
        () => {
            void flush().catch((error: unknown) =>
                onError(error instanceof Error ? error : new Error(String(error))),
            );
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

    const flush = (): Promise<void> => {
        stop();
        running ??= drain().finally(() => {
            running = undefined;
        });
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
