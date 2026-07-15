<script lang="ts" setup>
import type { HTMLAttributes } from 'vue';

import { MoreHorizontalIcon } from '@lucide/vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <span
        aria-hidden="true"
        :class="cn('flex size-8 items-center justify-center', props.class)"
        data-slot="breadcrumb-ellipsis"
        role="presentation"
    >
        <slot>
            <MoreHorizontalIcon class="size-5" />
        </slot>
        <span class="sr-only">More</span>
    </span>
</template>
