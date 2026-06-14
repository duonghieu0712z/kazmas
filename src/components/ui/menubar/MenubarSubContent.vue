<script setup lang="ts">
import type { MenubarSubContentEmits, MenubarSubContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { MenubarPortal, MenubarSubContent, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<MenubarSubContentProps & { class?: HTMLAttributes['class'] }>(),
    {
        sideOffset: 2,
    },
);
const emits = defineEmits<MenubarSubContentEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <MenubarPortal>
        <MenubarSubContent
            v-bind="{ ...$attrs, ...forwarded }"
            :class="
                cn(
                    'bg-popover text-popover-foreground z-50 min-w-32 origin-(--reka-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-xs',
                    'data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                    'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    props.class,
                )
            "
            data-slot="menubar-sub-content"
        >
            <slot />
        </MenubarSubContent>
    </MenubarPortal>
</template>
