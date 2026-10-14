<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui';

import { cn } from '@/lib/utils';

import ScrollBar from './ScrollBar.vue';

const props = withDefaults(
    defineProps<
        ScrollAreaRootProps & {
            class?: HTMLAttributes['class'];
            orientation?: 'vertical' | 'horizontal' | 'both';
            viewportAsChild?: boolean;
        }
    >(),
    { orientation: 'vertical' },
);

const delegatedProps = reactiveOmit(props, 'class', 'orientation', 'viewportAsChild');
</script>

<template>
    <ScrollAreaRoot
        v-bind="delegatedProps"
        :class="cn('relative', props.class)"
        data-slot="scroll-area"
    >
        <ScrollAreaViewport
            :as-child="viewportAsChild"
            :class="[
                'relative z-0 size-full rounded-[inherit] transition-[color,box-shadow] outline-none',
                'focus-visible:ring-[1.5px] focus-visible:ring-focus-ring/50 focus-visible:outline-1',
                '[&>div]:grid [&>div]:min-h-full',
                orientation === 'vertical' &&
                    '[&>div]:w-full [&>div]:min-w-0 [&>div]:grid-cols-[minmax(0,1fr)]',
            ]"
            data-slot="scroll-area-viewport"
        >
            <slot />
        </ScrollAreaViewport>
        <ScrollBar v-if="orientation === 'vertical' || orientation === 'both'" />
        <ScrollBar
            v-if="orientation === 'horizontal' || orientation === 'both'"
            orientation="horizontal"
        />
        <ScrollAreaCorner v-if="orientation === 'both'" />
    </ScrollAreaRoot>
</template>
