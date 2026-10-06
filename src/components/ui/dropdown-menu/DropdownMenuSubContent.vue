<script setup lang="ts">
import type {
    DropdownMenuPortalProps,
    DropdownMenuSubContentEmits,
    DropdownMenuSubContentProps,
} from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { DropdownMenuPortal, DropdownMenuSubContent, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

defineOptions({
    inheritAttrs: false,
});

const props = defineProps<
    DropdownMenuSubContentProps & {
        class?: HTMLAttributes['class'];
        portal?: DropdownMenuPortalProps;
    }
>();
const emits = defineEmits<DropdownMenuSubContentEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'portal');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <DropdownMenuPortal v-bind="portal">
        <DropdownMenuSubContent
            v-bind="{ ...$attrs, ...forwarded }"
            :class="
                cn(
                    'max-h-(--reka-dropdown-menu-content-available-height) max-w-(--reka-dropdown-menu-content-available-width) origin-(--reka-dropdown-menu-content-transform-origin)',
                    'z-50 min-w-32 overflow-x-hidden overflow-y-auto rounded-sm border border-popup-border bg-popup-background p-1 text-popup-foreground shadow-xs',
                    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                    props.class,
                )
            "
            data-slot="dropdown-menu-sub-content"
        >
            <slot />
        </DropdownMenuSubContent>
    </DropdownMenuPortal>
</template>
