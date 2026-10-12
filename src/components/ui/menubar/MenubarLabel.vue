<script setup lang="ts">
import type { MenubarLabelProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { MenubarLabel } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    MenubarLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, 'class', 'inset');
</script>

<template>
    <MenubarLabel
        v-bind="delegatedProps"
        :class="cn('flex h-6 items-center px-2 text-xs font-medium data-inset:pl-6', props.class)"
        :data-inset="inset ? '' : undefined"
    >
        <slot />
    </MenubarLabel>
</template>
