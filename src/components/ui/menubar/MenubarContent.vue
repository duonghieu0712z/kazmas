<script setup lang="ts">
import type { MenubarContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { MenubarContent, MenubarPortal, useForwardProps } from 'reka-ui';

import { cn } from '@/lib/utils';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<MenubarContentProps & { class?: HTMLAttributes['class'] }>(),
    {
        align: 'start',
        alignOffset: 0,
        sideOffset: 2,
    },
);

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <MenubarPortal>
        <MenubarContent
            v-bind="{ ...$attrs, ...forwardedProps }"
            :class="
                cn(
                    'z-50 max-h-(--reka-menubar-content-available-height) max-w-(--reka-menubar-content-available-width) min-w-48 origin-(--reka-menubar-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-popup-border bg-popup-background p-1 text-popup-foreground shadow-xs',
                    'data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                    'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    props.class,
                )
            "
            data-slot="menubar-content"
        >
            <slot />
        </MenubarContent>
    </MenubarPortal>
</template>
