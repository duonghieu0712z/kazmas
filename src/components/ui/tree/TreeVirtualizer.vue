<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { FlattenedItem, TreeVirtualizerProps } from 'reka-ui';

import { reactiveOmit } from '@vueuse/core';
import { injectTreeRootContext, Slot, TreeVirtualizer, useForwardProps } from 'reka-ui';

defineOptions({ inheritAttrs: false });

const props = defineProps<
    Omit<TreeVirtualizerProps, 'textContent'> & {
        scrollToKey?: string;
        textContent?: (item: T) => string;
    }
>();

type VirtualSlot = Parameters<
    NonNullable<InstanceType<typeof TreeVirtualizer>['$slots']['default']>
>[0];

const delegatedProps = reactiveOmit(props, 'scrollToKey', 'textContent');
const forwarded = useForwardProps(delegatedProps);
const tree = injectTreeRootContext();
let virtualizer: VirtualSlot['virtualizer'] | undefined;
defineSlots<{
    default(props: Omit<VirtualSlot, 'item'> & { item: FlattenedItem<T> }): unknown;
}>();

function getTextContent(item: Record<string, unknown>) {
    return props.textContent?.(item as T) ?? String(item);
}

function slotProps(value: VirtualSlot) {
    virtualizer = value.virtualizer;
    return { ...value, item: value.item as FlattenedItem<T> };
}

watch(
    () => props.scrollToKey,
    async (key) => {
        if (!key) {
            return;
        }
        await nextTick();
        const index = tree.expandedItems.value.findIndex((item) => item._id === key);
        if (index >= 0) {
            virtualizer?.scrollToIndex(index, { align: 'auto' });
        }
    },
    { flush: 'post' },
);
</script>

<template>
    <TreeVirtualizer
        v-slot="value"
        v-bind="{ ...forwarded, ...$attrs }"
        :text-content="getTextContent"
    >
        <Slot>
            <slot v-bind="slotProps(value)" />
        </Slot>
    </TreeVirtualizer>
</template>
