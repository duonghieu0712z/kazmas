<script setup lang="ts">
import type { ComboboxGroupProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ComboboxGroup, ComboboxLabel } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    ComboboxGroupProps & {
        class?: HTMLAttributes['class'];
        heading?: string;
    }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <ComboboxGroup
        v-bind="delegatedProps"
        :class="cn('overflow-hidden p-1 text-popup-foreground', props.class)"
        data-slot="combobox-group"
    >
        <ComboboxLabel
            v-if="heading"
            class="px-2 py-1.5 text-xs font-medium text-popup-muted-foreground"
        >
            {{ heading }}
        </ComboboxLabel>
        <slot />
    </ComboboxGroup>
</template>
