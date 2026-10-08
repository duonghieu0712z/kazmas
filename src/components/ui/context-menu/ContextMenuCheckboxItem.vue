<script setup lang="ts">
import type { ContextMenuCheckboxItemEmits, ContextMenuCheckboxItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { CheckIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { ContextMenuCheckboxItem, ContextMenuItemIndicator, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<ContextMenuCheckboxItemProps & { class?: HTMLAttributes['class'] }>();
const emits = defineEmits<ContextMenuCheckboxItemEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <ContextMenuCheckboxItem
        v-bind="forwarded"
        :class="
            cn(
                'relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm text-menu-item-foreground outline-hidden select-none',
                'focus:bg-menu-item-hover focus:text-menu-item-hover-foreground data-[state=checked]:bg-menu-item-selected data-[state=checked]:text-menu-item-selected-foreground',
                'data-disabled:pointer-events-none data-disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground! data-disabled:[&_svg]:text-disabled-foreground!',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
                props.class,
            )
        "
        data-slot="context-menu-checkbox-item"
    >
        <span class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
            <ContextMenuItemIndicator>
                <slot name="indicator-icon">
                    <CheckIcon class="size-4" />
                </slot>
            </ContextMenuItemIndicator>
        </span>
        <slot />
    </ContextMenuCheckboxItem>
</template>
