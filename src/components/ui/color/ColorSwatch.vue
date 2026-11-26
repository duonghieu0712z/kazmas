<script setup lang="ts">
import type { ColorSwatchProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ColorSwatch } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<ColorSwatchProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <ColorSwatch
        v-slot="slotProps"
        v-bind="delegatedProps"
        :class="
            cn(
                'inline-flex size-6 shrink-0 items-center justify-center rounded-sm',
                'bg-(--reka-color-swatch-color)',
                props.class,
            )
        "
        data-slot="color-swatch"
    >
        <slot v-bind="slotProps" />
    </ColorSwatch>
</template>
