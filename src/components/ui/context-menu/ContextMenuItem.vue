<script setup lang="ts">
import type { ContextMenuItemEmits, ContextMenuItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ContextMenuItem, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<
        ContextMenuItemProps & {
            class?: HTMLAttributes['class'];
            inset?: boolean;
            variant?: 'default' | 'destructive';
        }
    >(),
    {
        variant: 'default',
    },
);
const emits = defineEmits<ContextMenuItemEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <ContextMenuItem
        v-bind="forwarded"
        :class="
            cn(
                'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-menu-item-foreground outline-hidden select-none',
                'focus:bg-menu-item-hover focus:text-menu-item-hover-foreground',
                'data-disabled:pointer-events-none data-disabled:text-disabled-foreground! data-inset:pl-8 disabled:[&_svg]:text-disabled-foreground! data-disabled:[&_svg]:text-disabled-foreground!',
                'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-menu-item-icon-foreground data-[variant=destructive]:*:[svg]:text-destructive!`,
                props.class,
            )
        "
        :data-inset="inset ? '' : undefined"
        data-slot="context-menu-item"
        :data-variant="variant"
    >
        <slot />
    </ContextMenuItem>
</template>
