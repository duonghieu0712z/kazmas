import { config, enableAutoUnmount } from '@vue/test-utils';
import { injectTreeRootContext } from 'reka-ui';
import { afterEach, beforeEach, vi } from 'vitest';

import { resetTauri } from './tauri';

beforeEach(resetTauri);

config.global.stubs.TreeVirtualizer = defineComponent({
    setup(_props, { slots, attrs }) {
        const tree = injectTreeRootContext();
        return () =>
            h(
                'div',
                attrs,
                tree.expandedItems.value.flatMap((item) => slots.default?.({ item }) ?? []),
            );
    },
});

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
});

enableAutoUnmount(afterEach);
