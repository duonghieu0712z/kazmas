<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <div
        :class="
            cn(
                'group/input-group relative flex h-8 w-full min-w-0 items-center rounded-sm border border-input shadow-xs transition-[color,box-shadow] outline-none has-[>textarea]:h-auto dark:bg-input/30',

                // Variants based on alignment.
                'has-[>[data-align=inline-start]]:*:data-[slot=input-group-control]:pl-2',
                'has-[>[data-align=inline-end]]:*:data-[slot=input-group-control]:pr-2',
                'has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:*:data-[slot=input-group-control]:pb-1',
                'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:*:data-[slot=input-group-control]:pt-1',

                // Focus state.
                'has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[1.5px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50',
                // Error state.
                'has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',

                props.class,
            )
        "
        data-slot="input-group"
        role="group"
    >
        <slot />
    </div>
</template>
