<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { useMediaQuery } from '@vueuse/core';

import { ButtonGroup } from '@/components/ui/button-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();

const isNarrow = useMediaQuery('(max-width: 767px)');
</script>

<template>
    <ScrollArea
        v-if="isNarrow"
        :class="cn('relative z-40 w-full shrink-0 bg-background', props.class)"
        data-slot="toolbar"
        horizontal
    >
        <ButtonGroup
            :class="[
                'min-h-9 min-w-max flex-nowrap items-center justify-start border-b px-2 py-1',
                'has-[>[data-slot=button-group]]:shrink-0 has-[>[data-slot=button-group]]:gap-0.5',
            ]"
            spacing="spaced"
        >
            <slot />
        </ButtonGroup>
    </ScrollArea>

    <ButtonGroup
        v-else
        :class="
            cn(
                'relative z-40 h-auto min-h-9 w-full shrink-0 flex-wrap content-center items-center justify-center border-b bg-background px-2 py-1',
                'has-[>[data-slot=button-group]]:shrink-0 has-[>[data-slot=button-group]]:gap-0.5',
                props.class,
            )
        "
        data-slot="toolbar"
        spacing="spaced"
    >
        <slot />
    </ButtonGroup>
</template>
