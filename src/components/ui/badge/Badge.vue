<script setup lang="ts">
import type { BadgeVariants } from '.';
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { Primitive } from 'reka-ui';

import { cn } from '@/lib/utils';

import { badgeVariants } from '.';

const props = defineProps<
    PrimitiveProps & {
        variant?: BadgeVariants['variant'];
        class?: HTMLAttributes['class'];
    }
>();

const delegatedProps = reactiveOmit(props, 'class', 'variant');
</script>

<template>
    <Primitive
        :class="cn(badgeVariants({ variant }), props.class)"
        data-slot="badge"
        v-bind="delegatedProps"
    >
        <slot />
    </Primitive>
</template>
