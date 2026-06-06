<script setup lang="ts">
import type { ButtonProps } from '.';

import { Primitive } from 'reka-ui';

import { cn } from '@/lib/utils';

import { buttonVariants } from '.';

const props = withDefaults(defineProps<ButtonProps>(), {
    as: 'button',
    variant: 'default',
    size: 'default',
});
</script>

<template>
    <Primitive
        :as="as"
        :as-child="asChild"
        :class="cn(buttonVariants({ variant, size }), props.class)"
        :data-size="size"
        data-slot="button"
        :data-variant="variant"
    >
        <slot />
    </Primitive>
</template>
