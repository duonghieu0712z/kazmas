<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { Primitive } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<
        PrimitiveProps & {
            showOnHover?: boolean;
            class?: HTMLAttributes['class'];
        }
    >(),
    {
        as: 'button',
    },
);
</script>

<template>
    <Primitive
        :as="as"
        :as-child="asChild"
        :class="
            cn(
                'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-sm p-0 outline-hidden transition-transform',
                'text-sidebar-foreground ring-focus-ring',
                'focus-visible:ring-2',
                'peer-hover/menu-button:text-hover-foreground peer-data-[active=true]/menu-button:text-selected-foreground',
                'hover:bg-hover hover:text-hover-foreground active:bg-active active:text-active-foreground',
                'after:absolute after:-inset-2 md:after:hidden',
                'peer-data-[size=sm]/menu-button:top-1',
                'peer-data-[size=default]/menu-button:top-1.5',
                'peer-data-[size=lg]/menu-button:top-2.5',
                'group-data-[collapsible=icon]:hidden',
                `[&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4`,
                showOnHover &&
                    'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
                props.class,
            )
        "
        data-sidebar="menu-action"
        data-slot="sidebar-menu-action"
    >
        <slot />
    </Primitive>
</template>
