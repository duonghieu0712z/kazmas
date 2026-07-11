<script
    setup
    lang="ts"
    generic="
        T extends Record<string, unknown>,
        U extends Record<string, unknown>,
        M extends boolean = false
    "
>
import type { TreeRootEmits, TreeRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { TreeRoot, TreeVirtualizer, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<
        TreeRootProps<T, U, M> & {
            class?: HTMLAttributes['class'];
        }
    >(),
    {
        as: 'ul',
    },
);
const emits = defineEmits<TreeRootEmits<U, M>>();

const delegatedProps = reactiveOmit(props, 'class');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <TreeRoot v-bind="forwarded" :class="cn(props.class)" data-slot="tree-root" :get-key="getKey">
        <TreeVirtualizer v-slot="{ item }" data-slot="tree-virtualizer">
            <slot v-bind="item.bind" />
        </TreeVirtualizer>
    </TreeRoot>
</template>
