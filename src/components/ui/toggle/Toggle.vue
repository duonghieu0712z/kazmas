<script setup lang="ts">
import type { ToggleProps } from '.';
import type { ToggleEmits } from 'reka-ui';

import { reactiveOmit } from '@vueuse/core';
import { Toggle, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

import { toggleVariants } from '.';

const props = withDefaults(defineProps<ToggleProps>(), {
    variant: 'default',
    size: 'default',
    disabled: false,
});

const emits = defineEmits<ToggleEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <Toggle
        v-slot="slotProps"
        v-bind="forwarded"
        :class="cn(toggleVariants({ variant, size }), props.class)"
        data-slot="toggle"
    >
        <slot v-bind="slotProps" />
    </Toggle>
</template>
