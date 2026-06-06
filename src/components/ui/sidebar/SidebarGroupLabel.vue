<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { Primitive } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    PrimitiveProps & {
        class?: HTMLAttributes['class'];
    }
>();
</script>

<template>
    <Primitive
        :as="as"
        :as-child="asChild"
        :class="
            cn(
                'text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-sm px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2',
                'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
                `[&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4`,
                props.class,
            )
        "
        data-sidebar="group-label"
        data-slot="sidebar-group-label"
    >
        <slot />
    </Primitive>
</template>
