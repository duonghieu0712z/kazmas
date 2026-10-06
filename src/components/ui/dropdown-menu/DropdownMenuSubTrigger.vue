<script setup lang="ts">
import type { DropdownMenuSubTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { ChevronRight } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuSubTrigger, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    DropdownMenuSubTriggerProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class', 'inset');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <DropdownMenuSubTrigger
        v-bind="forwardedProps"
        :class="
            cn(
                'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-menu-item-foreground outline-hidden select-none',
                'focus:bg-menu-item-hover focus:text-menu-item-hover-foreground data-[state=open]:bg-menu-item-selected data-[state=open]:text-menu-item-selected-foreground',
                'data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8',
                'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-menu-item-icon-foreground data-[variant=destructive]:*:[svg]:text-destructive!`,
                props.class,
            )
        "
        :data-inset="inset ? '' : undefined"
        data-slot="dropdown-menu-sub-trigger"
    >
        <slot />
        <ChevronRight class="ml-auto size-4" />
    </DropdownMenuSubTrigger>
</template>
