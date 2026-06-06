<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { Primitive } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<
        PrimitiveProps & {
            size?: 'sm' | 'md';
            isActive?: boolean;
            class?: HTMLAttributes['class'];
        }
    >(),
    {
        as: 'a',
        size: 'md',
    },
);
</script>

<template>
    <Primitive
        :as="as"
        :as-child="asChild"
        :class="
            cn(
                'text-sidebar-foreground ring-sidebar-ring flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-sm px-2 outline-hidden focus-visible:ring-2 [&>span:last-child]:truncate',
                'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground',
                'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
                size === 'sm' && 'text-xs',
                size === 'md' && 'text-sm',
                'group-data-[collapsible=icon]:hidden',
                `[&>svg]:text-sidebar-accent-foreground [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4`,
                props.class,
            )
        "
        :data-active="isActive"
        data-sidebar="menu-sub-button"
        :data-size="size"
        data-slot="sidebar-menu-sub-button"
    >
        <slot />
    </Primitive>
</template>
