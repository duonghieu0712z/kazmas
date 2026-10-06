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
                'flex h-6 cursor-default items-center rounded-xs px-2 text-xs outline-none select-none',
                'focus:bg-menu-item-hover focus:text-menu-item-hover-foreground data-inset:pl-6',
                'data-[state=open]:bg-menu-item-selected data-[state=open]:text-menu-item-selected-foreground',
                'data-disabled:pointer-events-none data-disabled:opacity-50',
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
