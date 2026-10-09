<script setup lang="ts">
import type { MenubarSubTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { ChevronRightIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { MenubarSubTrigger, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    MenubarSubTriggerProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class', 'inset');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <MenubarSubTrigger
        v-bind="forwardedProps"
        :class="
            cn(
                'relative flex h-6 cursor-default items-center gap-2 rounded-xs px-2 text-xs outline-hidden select-none',
                'text-menu-item-foreground',
                'focus:bg-menu-item-hover focus:text-menu-item-hover-foreground data-inset:pl-6',
                'data-[state=open]:bg-menu-item-selected data-[state=open]:text-menu-item-selected-foreground',
                'data-disabled:pointer-events-none data-disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground! data-disabled:[&_svg]:text-disabled-foreground!',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-menu-item-icon-foreground`,
                props.class,
            )
        "
        :data-inset="inset ? '' : undefined"
        data-slot="menubar-sub-trigger"
    >
        <slot />
        <ChevronRightIcon class="ml-auto size-3.5" />
    </MenubarSubTrigger>
</template>
