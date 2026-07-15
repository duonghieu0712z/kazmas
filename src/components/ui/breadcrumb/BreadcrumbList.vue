<script lang="ts" setup>
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <ol
        :class="
            cn(
                'text-muted-foreground flex flex-wrap items-center text-sm wrap-break-word',
                props.class,
            )
        "
        data-slot="breadcrumb-list"
    >
        <slot />
    </ol>
</template>
