<script setup lang="ts">
import type { ContextMenuSubTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { ChevronRightIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { ContextMenuSubTrigger, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    ContextMenuSubTriggerProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <ContextMenuSubTrigger
        v-bind="forwardedProps"
        :class="
            cn(
                'relative flex h-6 cursor-default items-center gap-2 rounded-xs px-2 text-xs text-menu-item-foreground outline-hidden select-none data-inset:pl-6',
                'focus:bg-menu-item-hover focus:text-menu-item-hover-foreground',
                'data-[state=open]:bg-menu-item-selected data-[state=open]:text-menu-item-selected-foreground',
                'data-disabled:pointer-events-none data-disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground! data-disabled:[&_svg]:text-disabled-foreground!',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-menu-item-icon-foreground`,
                props.class,
            )
        "
        :data-inset="inset ? '' : undefined"
        data-slot="context-menu-sub-trigger"
    >
        <slot />
        <ChevronRightIcon class="ml-auto size-3.5" />
    </ContextMenuSubTrigger>
</template>
