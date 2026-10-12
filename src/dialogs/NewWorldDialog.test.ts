import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import { Dialog } from '@/components/ui/dialog';

import { tauri } from '../../tests/unit/tauri';
import NewWorldDialog from './NewWorldDialog.vue';

describe('new world dialog', () => {
    const createDialog = () => {
        return mount(
            defineComponent({
                components: { Dialog, NewWorldDialog },
                template: '<Dialog open><NewWorldDialog /></Dialog>',
            }),
            { attachTo: document.body },
        );
    };

    const button = (text: string) => {
        return [...document.querySelectorAll<HTMLButtonElement>('button')].find(
            (element) => element.textContent?.trim() === text,
        )!;
    };

    it('requires a destination and nonblank name, then emits trimmed input', async () => {
        const wrapper = createDialog();
        await flushPromises();
        expect(button('Create').disabled).toBe(true);
        tauri.open.mockResolvedValue('/test/worlds');
        button('Browse').click();
        await flushPromises();
        const input = document.querySelector<HTMLInputElement>('#new-world-name')!;
        input.value = '   ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await flushPromises();
        expect(button('Create').disabled).toBe(true);
        input.value = '  New World  ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await flushPromises();
        button('Create').click();
        await flushPromises();
        expect(wrapper.findComponent(NewWorldDialog).emitted('resolve:dialog')).toEqual([
            [{ name: 'New World', path: '/test/worlds' }],
        ]);
    });

    it('keeps creation disabled when browsing is cancelled and emits cancel', async () => {
        const wrapper = createDialog();
        tauri.open.mockResolvedValue(null);
        await flushPromises();
        button('Browse').click();
        await flushPromises();
        expect(button('Create').disabled).toBe(true);
        button('Cancel').click();
        expect(wrapper.findComponent(NewWorldDialog).emitted('close:dialog')).toEqual([[]]);
    });
});
