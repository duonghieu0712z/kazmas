<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { useMediaQuery, useResizeObserver } from '@vueuse/core';

import { ButtonGroup } from '@/components/ui/button-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();

const isNarrow = useMediaQuery('(max-width: 767px)');
const toolbar = useTemplateRef<HTMLElement>('toolbar');

function updateSeparators() {
    const separators = toolbar.value?.querySelectorAll<HTMLElement>(
        ':scope > [data-slot="button-group"] > [data-slot="button-group-separator"]',
    );

    for (const separator of separators ?? []) {
        const previous = separator.previousElementSibling as HTMLElement | null;
        const next = separator.nextElementSibling as HTMLElement | null;
        const separatesRows = previous && next && previous.offsetTop !== next.offsetTop;

        separator.style.visibility = separatesRows ? 'hidden' : '';
    }
}

useResizeObserver(toolbar, updateSeparators);
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

    <div
        v-else
        ref="toolbar"
        :class="cn('relative z-40 w-full shrink-0 bg-background', props.class)"
        data-slot="toolbar"
    >
        <ButtonGroup
            :class="[
                'h-auto min-h-9 w-full flex-wrap content-center items-center justify-center border-b px-2 py-1',
                'has-[>[data-slot=button-group]]:shrink-0 has-[>[data-slot=button-group]]:gap-0.5',
            ]"
            spacing="spaced"
        >
            <slot />
        </ButtonGroup>
    </div>
</template>
