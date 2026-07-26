<script setup lang="ts">
import type { ButtonGroupVariants } from '.';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

import { buttonGroupVariants } from '.';

const props = withDefaults(
    defineProps<{
        class?: HTMLAttributes['class'];
        orientation?: ButtonGroupVariants['orientation'];
        spacing?: ButtonGroupVariants['spacing'];
    }>(),
    {
        orientation: 'horizontal',
        spacing: 'compact',
    },
);
</script>

<template>
    <div
        :class="cn(buttonGroupVariants({ orientation, spacing }), props.class)"
        :data-orientation="orientation"
        data-slot="button-group"
        role="group"
    >
        <slot />
    </div>
</template>
