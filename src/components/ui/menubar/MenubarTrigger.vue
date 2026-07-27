<script setup lang="ts">
import type { MenubarTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { MenubarTrigger, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<MenubarTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <MenubarTrigger
        v-bind="forwardedProps"
        :class="
            cn(
                'flex h-6 items-center rounded-sm px-2 text-xs font-medium outline-hidden select-none',
                'hover:bg-accent focus:bg-accent focus:text-accent-foreground',
                'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
                props.class,
            )
        "
        data-slot="menubar-trigger"
    >
        <slot />
    </MenubarTrigger>
</template>
