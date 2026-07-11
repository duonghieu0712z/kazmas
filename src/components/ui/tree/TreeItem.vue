<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TreeItemEmits, TreeItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { TreeItem, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

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
</script>

<template>
    <TreeItem
        v-slot="slotProps"
        v-bind="forwarded"
        :class="cn(props.class)"
        data-slot="tree-item"
        :level="level"
        :value="value"
    >
        <slot v-bind="slotProps" />
    </TreeItem>
</template>
