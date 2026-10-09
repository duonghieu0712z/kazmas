<script setup lang="ts">
import type { DropdownMenuItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuItem, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<
        DropdownMenuItemProps & {
            class?: HTMLAttributes['class'];
            inset?: boolean;
            variant?: 'default' | 'destructive';
        }
    >(),
    {
        variant: 'default',
    },
);

const delegatedProps = reactiveOmit(props, 'inset', 'variant', 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <DropdownMenuItem
        v-bind="forwardedProps"
        :class="
            cn(
                'relative flex h-6 cursor-default items-center gap-2 rounded-xs px-2 text-xs text-menu-item-foreground outline-hidden select-none',
                'focus:bg-menu-item-hover focus:text-menu-item-hover-foreground',
                'data-disabled:pointer-events-none data-disabled:text-disabled-foreground! data-inset:pl-6 disabled:[&_svg]:text-disabled-foreground! data-disabled:[&_svg]:text-disabled-foreground!',
                'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-menu-item-icon-foreground data-[variant=destructive]:*:[svg]:text-destructive!`,
                props.class,
            )
        "
        :data-inset="inset ? '' : undefined"
        data-slot="dropdown-menu-item"
        :data-variant="variant"
    >
        <slot />
    </DropdownMenuItem>
</template>
