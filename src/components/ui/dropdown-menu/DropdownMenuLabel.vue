<script setup lang="ts">
import type { DropdownMenuLabelProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuLabel, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    DropdownMenuLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class', 'inset');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <DropdownMenuLabel
        v-bind="forwardedProps"
        :class="cn('flex h-6 items-center px-2 text-xs font-medium data-inset:pl-6', props.class)"
        :data-inset="inset ? '' : undefined"
        data-slot="dropdown-menu-label"
    >
        <slot />
    </DropdownMenuLabel>
</template>
