<script setup lang="ts">
import type { MenubarItemEmits, MenubarItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { MenubarItem, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<
    MenubarItemProps & {
        class?: HTMLAttributes['class'];
        inset?: boolean;
        variant?: 'default' | 'destructive';
    }
>();

const emits = defineEmits<MenubarItemEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'inset', 'variant');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <MenubarItem
        v-bind="forwarded"
        :class="
            cn(
                'relative flex h-6 cursor-default items-center gap-2 rounded-xs px-2 text-xs outline-hidden select-none',
                'focus:bg-accent focus:text-accent-foreground data-inset:pl-6',
                'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/40 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive!',
                'data-disabled:pointer-events-none data-disabled:opacity-50',
                `[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
                props.class,
            )
        "
        :data-inset="inset ? '' : undefined"
        data-slot="menubar-item"
        :data-variant="variant"
    >
        <slot />
    </MenubarItem>
</template>
