import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useNodeStore } from '@/stores/nodes';

import { node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import NodeBreadcrumb from './NodeBreadcrumb.vue';

describe('node breadcrumb', () => {
    it('renders the opened document path and disappears after clearing the world', async () => {
        setActivePinia(createPinia());
        const store = useNodeStore();
        const wrapper = mount(NodeBreadcrumb);
        expect(wrapper.find('nav').exists()).toBe(false);
        tauri.getManuscripts.mockResolvedValue({ status: 'ok', data: [node()] });
        await store.reloadNodes();
        store.openNode(node());
        await nextTick();
        expect(wrapper.text()).toContain('Manuscript');
        expect(wrapper.text()).toContain('Chapter A');
        store.clearNodes();
        await nextTick();
        expect(wrapper.find('nav').exists()).toBe(false);
    });
});
