<script lang="ts">
import type { ComputedRef } from 'vue';

import { createContext } from 'reka-ui';

export type TreeContext = {
    chevron: ComputedRef<boolean>;
    expandOnChevronOnly: ComputedRef<boolean>;
    indentGuide: ComputedRef<boolean>;
};

export const [injectTreeContext, provideTreeContext] = createContext<TreeContext>('Tree');
</script>

<script
    setup
    lang="ts"
    generic="
        T extends Record<string, any>,
        U extends Record<string, any>,
        M extends boolean = false
    "
>
import type { TreeRootEmits, TreeRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { TreeRoot, useForwardPropsEmits } from 'reka-ui';
import { computed } from 'vue';

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<
        TreeRootProps<T, U, M> & {
            class?: HTMLAttributes['class'];
            chevron?: boolean;
            expandOnChevronOnly?: boolean;
            indentGuide?: boolean;
        }
    >(),
    {
        as: 'ul',
        chevron: false,
        expandOnChevronOnly: false,
        indentGuide: false,
    },
);
const emits = defineEmits<TreeRootEmits<U, M>>();

const delegatedProps = reactiveOmit(
    props,
    'class',
    'chevron',
    'expandOnChevronOnly',
    'indentGuide',
);
const forwarded = useForwardPropsEmits(delegatedProps, emits);

provideTreeContext({
    chevron: computed(() => props.chevron),
    expandOnChevronOnly: computed(() => props.expandOnChevronOnly),
    indentGuide: computed(() => props.indentGuide),
});
</script>

<template>
    <TreeRoot
        v-slot="item"
        v-bind="forwarded"
        :class="cn('h-full', props.class)"
        data-slot="tree-root"
        :get-key="getKey"
    >
        <slot v-bind="item" />
    </TreeRoot>
</template>
