import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { expect, it } from 'vitest';
import { nextTick } from 'vue';

import { SidebarProvider } from '@/components/ui/sidebar';
import { useNodeStore } from '@/stores/nodes';

import { node } from '../../../tests/support/fixtures';
import { tauri } from '../../../tests/unit/tauri';
import AppActivityBar from './AppActivityBar.vue';
import AppSidebar from './AppSidebar.vue';

it('preserves each tree expansion and selection when switching activities', async () => {
    setActivePinia(createPinia());

    tauri.getManuscripts.mockResolvedValue({
        status: 'ok',
        data: [
            node({ id: 'manuscript-folder', kind: 'folder' }),
            node({ parentId: 'manuscript-folder' }),
            node({ id: 'closed-folder', kind: 'folder' }),
            node({ id: 'closed-child', parentId: 'closed-folder' }),
        ],
    });
    tauri.getWikis.mockResolvedValue({
        status: 'ok',
        data: [
            node({ id: 'wiki-folder', kind: 'folder' }),
            node({ id: 'wiki-entry', parentId: 'wiki-folder', kind: 'wiki_entry' }),
        ],
    });
    await useNodeStore().reloadNodes();

    const wrapper = mount(SidebarProvider, {
        attachTo: document.body,
        props: { defaultOpen: true },
        slots: { default: AppSidebar },
        global: {
            stubs: {
                AppActivityBar: true,
                Sidebar: { template: '<div><slot /></div>' },
                SidebarContent: { template: '<div><slot /></div>' },
                ScrollArea: { template: '<div><slot /></div>' },
            },
        },
    });

    const activity = wrapper.getComponent(AppActivityBar);
    activity.vm.$emit('update:modelValue', 'Manuscript');
    await nextTick();

    const manuscripts = wrapper.get('[role="tree"][aria-label="Manuscript"]');
    const wikis = wrapper.get('[role="tree"][aria-label="Wiki"]');
    expect(manuscripts.isVisible()).toBe(true);
    expect(wikis.isVisible()).toBe(false);

    await manuscripts.get('.tree-chevron-icon').trigger('click');
    await manuscripts.findAll('[role="treeitem"]')[1]!.trigger('click');

    activity.vm.$emit('update:modelValue', 'Wiki');
    await nextTick();
    expect(manuscripts.isVisible()).toBe(false);
    expect(wikis.isVisible()).toBe(true);
    await wikis.get('.tree-chevron-icon').trigger('click');

    activity.vm.$emit('update:modelValue', 'Assets');
    await nextTick();
    expect(manuscripts.isVisible()).toBe(false);
    expect(wikis.isVisible()).toBe(false);

    activity.vm.$emit('update:modelValue', 'Manuscript');
    await nextTick();

    const manuscriptItems = manuscripts.findAll('[role="treeitem"]');
    expect(manuscriptItems).toHaveLength(3);
    expect(manuscriptItems[0]!.attributes('aria-expanded')).toBe('true');
    expect(manuscriptItems[1]!.attributes('aria-selected')).toBe('true');
    expect(manuscriptItems[2]!.attributes('aria-expanded')).toBe('false');

    activity.vm.$emit('update:modelValue', 'Wiki');
    await nextTick();
    expect(wikis.findAll('[role="treeitem"]')).toHaveLength(2);
    expect(wikis.get('[role="treeitem"]').attributes('aria-expanded')).toBe('true');
    await wikis.get('.tree-chevron-icon').trigger('click');

    activity.vm.$emit('update:modelValue', 'Manuscript');
    await nextTick();
    activity.vm.$emit('update:modelValue', 'Wiki');
    await nextTick();
    expect(wikis.findAll('[role="treeitem"]')).toHaveLength(1);
    expect(wikis.get('[role="treeitem"]').attributes('aria-expanded')).toBe('false');
});
