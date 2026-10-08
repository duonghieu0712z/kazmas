<script setup lang="ts">
import type { ContextMenuSubContentEmits, ContextMenuSubContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ContextMenuPortal, ContextMenuSubContent, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<ContextMenuSubContentProps & { class?: HTMLAttributes['class'] }>(),
    {
        sideOffset: 2,
        alignOffset: 0,
    },
);
const emits = defineEmits<ContextMenuSubContentEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <ContextMenuPortal>
        <ContextMenuSubContent
            v-bind="{ ...$attrs, ...forwarded }"
            :class="
                cn(
                    'z-50 max-h-(--reka-context-menu-content-available-height) max-w-(--reka-context-menu-content-available-width) min-w-32 origin-(--reka-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-popup-border bg-popup-background p-1 text-popup-foreground shadow-xs',
                    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    props.class,
                )
            "
            data-slot="context-menu-sub-content"
            @contextmenu.stop.prevent
        >
            <slot />
        </ContextMenuSubContent>
    </ContextMenuPortal>
</template>
