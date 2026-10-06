<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { TabsTrigger, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <TabsTrigger
        :class="
            cn(
                'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-tabs-trigger-foreground transition-[color,box-shadow]',
                'hover:bg-tabs-trigger-hover hover:text-tabs-trigger-hover-foreground',
                'active:bg-active active:text-active-foreground',
                'data-[state=active]:bg-tabs-trigger-selected data-[state=active]:text-tabs-trigger-selected-foreground data-[state=active]:shadow-sm',
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
