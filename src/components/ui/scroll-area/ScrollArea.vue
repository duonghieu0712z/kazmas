<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui';

import { cn } from '@/lib/utils';

import ScrollBar from './ScrollBar.vue';

const props = defineProps<
    ScrollAreaRootProps & {
        class?: HTMLAttributes['class'];
        horizontal?: boolean;
    }
>();

const delegatedProps = reactiveOmit(props, 'class', 'horizontal');
</script>

<template>
    <ScrollAreaRoot
        v-bind="delegatedProps"
        :class="cn('relative', props.class)"
        data-slot="scroll-area"
    >
        <ScrollAreaViewport
            :class="[
                'size-full rounded-[inherit] transition-[color,box-shadow] outline-none',
                'focus-visible:ring-[1.5px] focus-visible:ring-ring/50 focus-visible:outline-1',
                '[&>div]:grid [&>div]:min-h-full',
            ]"
            data-slot="scroll-area-viewport"
        >
            <slot />
        </ScrollAreaViewport>
        <ScrollBar />
        <ScrollBar v-if="horizontal" orientation="horizontal" />
        <ScrollAreaCorner />
    </ScrollAreaRoot>
</template>
