<script setup lang="ts">
import type { ContextMenuLabelProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ContextMenuLabel } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    ContextMenuLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <ContextMenuLabel
        v-bind="delegatedProps"
        :class="cn('flex h-6 items-center px-2 text-xs font-medium data-inset:pl-6', props.class)"
        :data-inset="inset ? '' : undefined"
        data-slot="context-menu-label"
    >
        <slot />
    </ContextMenuLabel>
</template>
