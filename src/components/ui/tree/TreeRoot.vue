<script lang="ts">
import type { ComputedRef } from 'vue';

import { createContext } from 'reka-ui';

export const [useTree, provideTreeContext] = createContext<{
    chevron: ComputedRef<boolean>;
    indentGuide: ComputedRef<boolean>;
}>('Tree');
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

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<
        TreeRootProps<T, U, M> & {
            class?: HTMLAttributes['class'];
            chevron?: boolean;
            indentGuide?: boolean;
        }
    >(),
    {
        as: 'ul',
        chevron: false,
        indentGuide: false,
    },
);
const emits = defineEmits<TreeRootEmits<U, M>>();

const delegatedProps = reactiveOmit(props, 'class', 'chevron', 'indentGuide');
const forwarded = useForwardPropsEmits(delegatedProps, emits);

provideTreeContext({
    chevron: computed(() => props.chevron),
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
