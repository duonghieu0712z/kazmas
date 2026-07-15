<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TreeItemEmits, TreeItemProps, TreeItemToggleEvent } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { ChevronRightIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { injectTreeRootContext, TreeItem, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

import { injectTreeContext } from './TreeRoot.vue';

const TREE_ITEM_BASE_INDENT = 8;
const TREE_ITEM_LEVEL_INDENT = 12;
const TREE_ITEM_GUIDE_OFFSET = 6;

const props = withDefaults(
    defineProps<
        TreeItemProps<T> & {
            class?: HTMLAttributes['class'];
        }
    >(),
    {
        as: 'li',
    },
);
const emits = defineEmits<TreeItemEmits<T>>();

const delegatedProps = reactiveOmit(props, 'class');
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const rootContext = injectTreeRootContext();
const hasChildren = computed(() => !!rootContext.getChildren(props.value)?.length);

const treeContext = injectTreeContext();
const { chevron, expandOnChevronOnly, indentGuide } = treeContext;

function toggleItem(event: TreeItemToggleEvent<T>) {
    const originalEvent = event.detail?.originalEvent;
    const target = originalEvent?.target;

    if (
        chevron.value &&
        expandOnChevronOnly.value &&
        originalEvent?.type === 'click' &&
        (!(target instanceof Element) || !target.closest('.tree-chevron-icon'))
    ) {
        event.preventDefault();
    }
}
</script>

<template>
    <TreeItem
        v-slot="slotProps"
        v-bind="forwarded"
        :class="
            cn(
                [
                    'text-sidebar-accent-foreground relative flex h-6 w-full min-w-0 cursor-pointer items-center pe-2 transition-colors outline-none',
                    'hover:bg-sidebar-accent/60 focus-visible:bg-sidebar-accent/60 data-selected:bg-sidebar-accent',
                    'data-disabled:pointer-events-none data-disabled:opacity-50',
                    // Indent guide
                    indentGuide && [
                        `before:pointer-events-none before:absolute before:inset-y-0 before:left-(--tree-item-guide-start) before:w-(--tree-item-guide-width) before:content-['']`,
                        'before:bg-[repeating-linear-gradient(to_right,var(--sidebar-border)_0,var(--sidebar-border)_1px,transparent_1px,transparent_var(--tree-item-level-indent))]',
                    ],
                ],
                props.class,
            )
        "
        data-slot="tree-item"
        :level="level"
        :style="{
            '--tree-item-base-indent': `${TREE_ITEM_BASE_INDENT}px`,
            '--tree-item-level-indent': `${TREE_ITEM_LEVEL_INDENT}px`,
            '--tree-item-padding': `${(level - 1) * TREE_ITEM_LEVEL_INDENT + TREE_ITEM_BASE_INDENT}px`,

            '--tree-item-guide-offset': `${TREE_ITEM_GUIDE_OFFSET}px`,
            '--tree-item-guide-start': `${TREE_ITEM_BASE_INDENT + TREE_ITEM_GUIDE_OFFSET}px`,
            '--tree-item-guide-width': `calc(var(--tree-item-padding) - var(--tree-item-guide-start))`,

            paddingInlineStart: 'var(--tree-item-padding)',
        }"
        :value="value"
        @toggle="toggleItem"
    >
        <ChevronRightIcon
            v-if="chevron"
            :class="
                cn(
                    'tree-chevron-icon mr-1 size-3.5 shrink-0 transition-transform',
                    slotProps.isExpanded && 'rotate-90',
                    !hasChildren && 'pointer-events-none opacity-0',
                )
            "
            @click.stop="slotProps.handleToggle"
        />
        <slot v-bind="slotProps" />
    </TreeItem>
</template>
