<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { TabsTrigger, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = withDefaults(defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>(), {
    as: 'div',
});

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <TabsTrigger
        :class="
            cn(
                'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow]',
                'border-transparent text-tabs-trigger-foreground',
                'hover:bg-tabs-trigger-hover hover:text-tabs-trigger-hover-foreground',
                'active:bg-active active:text-active-foreground',
                'aria-selected:bg-tabs-trigger-selected aria-selected:text-tabs-trigger-selected-foreground aria-selected:shadow-sm',
                'focus-visible:border-focus-ring focus-visible:ring-[1.5px] focus-visible:ring-focus-ring/50 focus-visible:outline-1 focus-visible:outline-focus-ring',
                'disabled:pointer-events-none disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground!',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
                props.class,
            )
        "
        data-slot="tabs-trigger"
        v-bind="forwardedProps"
    >
        <slot />
    </TabsTrigger>
</template>
