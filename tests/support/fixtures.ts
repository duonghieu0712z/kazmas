import type { NodeDto, WorldManifestDto } from '@/generated/bindings';

export function node(overrides: Partial<NodeDto> = {}): NodeDto {
    return {
        id: 'entry-a',
        parentId: null,
        name: 'Chapter A',
        kind: 'manuscript_entry',
        createdAt: '2026-01-01T00:00:00Z',
        modifiedAt: '2026-01-01T00:00:00Z',
        deletedAt: null,
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
