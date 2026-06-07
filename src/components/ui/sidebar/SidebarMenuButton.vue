<script setup lang="ts">
import type { SidebarMenuButtonProps } from './SidebarMenuButtonChild.vue';
import type { Component } from 'vue';

import { reactiveOmit } from '@vueuse/core';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import SidebarMenuButtonChild from './SidebarMenuButtonChild.vue';
import { useSidebar } from './utils';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<
        SidebarMenuButtonProps & {
            tooltip?: string | Component;
            alwaysShowTooltip?: boolean;
        }
    >(),
    {
        as: 'button',
        variant: 'default',
        size: 'default',
        alwaysShowTooltip: false,
    },
);

const { isMobile, state } = useSidebar();

const delegatedProps = reactiveOmit(props, 'tooltip', 'alwaysShowTooltip');
</script>

<template>
    <SidebarMenuButtonChild v-if="!tooltip" v-bind="{ ...delegatedProps, ...$attrs }">
        <slot />
    </SidebarMenuButtonChild>

    <Tooltip v-else>
        <TooltipTrigger>
            <SidebarMenuButtonChild v-bind="{ ...delegatedProps, ...$attrs }">
                <slot />
            </SidebarMenuButtonChild>
        </TooltipTrigger>
        <TooltipContent
            align="center"
            :hidden="isMobile || (!alwaysShowTooltip && state !== 'collapsed')"
            side="right"
        >
            <template v-if="typeof tooltip === 'string'">
                {{ tooltip }}
            </template>
            <component :is="tooltip" v-else />
        </TooltipContent>
    </Tooltip>
</template>
