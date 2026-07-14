<script lang="ts" setup>
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <span
        aria-current="page"
        aria-disabled="true"
        :class="cn('text-foreground font-normal', props.class)"
        data-slot="breadcrumb-page"
        role="link"
    >
        <slot />
    </span>
</template>
