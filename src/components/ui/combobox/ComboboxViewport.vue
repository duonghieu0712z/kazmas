<script setup lang="ts">
import type { ComboboxViewportProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ComboboxViewport, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<ComboboxViewportProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
    <ComboboxViewport
        v-bind="forwarded"
        :class="cn('max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto', props.class)"
        data-slot="combobox-viewport"
    >
        <slot />
    </ComboboxViewport>
</template>
