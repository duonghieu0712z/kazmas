<script setup lang="ts">
import type { ResizableSeparation } from './context';
import type { SplitterGroupEmits, SplitterGroupProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { SplitterGroup, useForwardPropsEmits } from 'reka-ui';
import { computed } from 'vue';

import { cn } from '@/lib/utils';

import { provideResizableContext } from './context';

const props = withDefaults(
    defineProps<
        SplitterGroupProps & {
            separation?: ResizableSeparation;
            class?: HTMLAttributes['class'];
        }
    >(),
    {
        separation: 'gap',
        direction: 'horizontal',
    },
);
const emits = defineEmits<SplitterGroupEmits>();

const delegatedProps = reactiveOmit(props, 'separation', 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);

provideResizableContext({
    separation: computed(() => props.separation),
    orientation: computed(() => props.direction),
});
</script>

<template>
    <SplitterGroup
        v-slot="slotProps"
        v-bind="forwarded"
        :class="cn('flex h-full w-full data-[orientation=vertical]:flex-col', props.class)"
        data-slot="resizable-panel-group"
    >
        <slot v-bind="slotProps" />
    </SplitterGroup>
</template>
