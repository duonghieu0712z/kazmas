<script setup lang="ts">
import type { ComboboxTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ComboboxTrigger, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<ComboboxTriggerProps & { class?: HTMLAttributes['class'] }>(),
    { as: 'div' },
);

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
    <ComboboxTrigger
        v-bind="forwarded"
        :class="cn('', props.class)"
        data-slot="combobox-trigger"
        tabindex="0"
    >
        <slot />
    </ComboboxTrigger>
</template>
