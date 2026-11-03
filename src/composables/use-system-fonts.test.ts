import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deferred } from '../../tests/support/fixtures';

const { getSystemFonts } = vi.hoisted(() => ({ getSystemFonts: vi.fn() }));

vi.mock('@/generated/bindings', () => ({ commands: { getSystemFonts } }));

describe('system font loading', () => {
    beforeEach(() => {
        vi.resetModules();
        getSystemFonts.mockReset();
    });

    it('loads lazily and shares one pending request and cached result across consumers', async () => {
        const result = deferred<{ status: 'ok'; data: string[] }>();
        getSystemFonts.mockReturnValue(result.promise);
        const { useSystemFonts } = await import('./use-system-fonts');
        const first = useSystemFonts();
        const second = useSystemFonts();
        expect(getSystemFonts).not.toHaveBeenCalled();

        const pending = first.loadFonts();
        await second.loadFonts();
        expect(getSystemFonts).toHaveBeenCalledTimes(1);
        expect(first.isLoading.value).toBe(true);

        result.resolve({ status: 'ok', data: ['Geist', 'Lora'] });
        await pending;
        await flushPromises();
        expect(first.fonts.value).toEqual(['Geist', 'Lora']);
        expect(second.fonts.value).toEqual(first.fonts.value);
        expect(first.isLoading.value).toBe(false);
        await second.loadFonts();
        expect(getSystemFonts).toHaveBeenCalledTimes(1);
    });

    it('exposes errors and retries a failed load instead of caching the failure', async () => {
        getSystemFonts.mockResolvedValueOnce({
            status: 'error',
            error: { message: 'Fonts unavailable' },
        });
        getSystemFonts.mockResolvedValueOnce({ status: 'ok', data: ['Geist'] });
        const { useSystemFonts } = await import('./use-system-fonts');
        const state = useSystemFonts();

        await state.loadFonts();
        expect(state.error.value).toBeInstanceOf(Error);
        expect((state.error.value as Error).message).toBe('Fonts unavailable');
        expect(state.fonts.value).toEqual([]);

        await state.loadFonts();
        expect(getSystemFonts).toHaveBeenCalledTimes(2);
        expect(state.error.value).toBeUndefined();
        expect(state.fonts.value).toEqual(['Geist']);
    });
});
