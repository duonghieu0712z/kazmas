<script lang="ts" setup>
import type { HTMLAttributes } from 'vue';

import { ChevronRightIcon } from '@lucide/vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <li
        aria-hidden="true"
        :class="cn('[&>svg]:size-3.5', props.class)"
        data-slot="breadcrumb-separator"
        role="presentation"
    >
        <slot>
            <ChevronRightIcon />
        </slot>
    </li>
</template>
