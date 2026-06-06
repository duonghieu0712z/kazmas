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
                'text-sidebar-foreground ring-sidebar-ring absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-sm p-0 outline-hidden transition-transform focus-visible:ring-2',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'after:absolute after:-inset-2 md:after:hidden',
                'group-data-[collapsible=icon]:hidden',
                `[&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4`,
                props.class,
            )
        "
        data-sidebar="group-action"
        data-slot="sidebar-group-action"
    >
        <slot />
    </Primitive>
</template>
