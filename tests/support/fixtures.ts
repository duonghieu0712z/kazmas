import type { NodeDto_Serialize, WorldManifestDto } from '@/generated/bindings';

export function node(overrides: Partial<NodeDto_Serialize> = {}): NodeDto_Serialize {
    return {
        id: 'entry-a',
        name: 'Chapter A',
        kind: 'manuscript_entry',
        createdAt: '2026-01-01T00:00:00Z',
        modifiedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

export function manifest(id = 'world-a'): WorldManifestDto {
    return {
        id,
        name: id,
        createdAt: '2026-01-01T00:00:00Z',
        modifiedAt: '2026-01-01T00:00:00Z',
        openedAt: '2026-01-01T00:00:00Z',
    };
}

export function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}
