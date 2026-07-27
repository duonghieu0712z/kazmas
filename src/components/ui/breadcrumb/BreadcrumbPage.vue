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
        :class="cn('font-normal text-foreground', props.class)"
        data-slot="breadcrumb-page"
        role="link"
    >
        <slot />
    </span>
</template>
