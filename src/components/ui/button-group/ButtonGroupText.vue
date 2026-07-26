<script setup lang="ts">
import type { ButtonGroupVariants } from '.';
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { Primitive } from 'reka-ui';

import { cn } from '@/lib/utils';

interface Props extends PrimitiveProps {
    class?: HTMLAttributes['class'];
    orientation?: ButtonGroupVariants['orientation'];
}

const props = withDefaults(defineProps<Props>(), {
    as: 'div',
});
</script>

<template>
    <Primitive
        :as="as"
        :as-child="asChild"
        :class="
            cn(
                'bg-muted flex items-center gap-2 rounded-sm border px-4 text-sm font-medium shadow-xs',
                `[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4`,
                props.class,
            )
        "
        :data-orientation="orientation"
        data-slot="button-group-text"
        role="group"
    >
        <slot />
    </Primitive>
</template>
