<script setup lang="ts">
import type { ComboboxItemEmits, ComboboxItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { ComboboxItem, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<ComboboxItemProps & { class?: HTMLAttributes['class'] }>();
const emits = defineEmits<ComboboxItemEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <ComboboxItem
        v-bind="forwarded"
        :class="
            cn(
                'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-menu-item-foreground outline-hidden select-none',
                'data-disabled:pointer-events-none data-disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground! data-disabled:[&_svg]:text-disabled-foreground!',
                'data-highlighted:bg-menu-item-hover data-highlighted:text-menu-item-hover-foreground data-[state=checked]:bg-menu-item-selected data-[state=checked]:text-menu-item-selected-foreground',
                `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-menu-item-icon-foreground`,
                props.class,
            )
        "
        data-slot="combobox-item"
    >
        <slot />
    </ComboboxItem>
</template>
