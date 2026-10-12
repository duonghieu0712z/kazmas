<script setup lang="ts">
import type { TabsListProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { reactiveOmit } from '@vueuse/core';
import { TabsList } from 'reka-ui';

import { cn } from '@/lib/utils';

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <TabsList
        v-bind="delegatedProps"
        :class="
            cn(
                'inline-flex h-8 w-fit items-center justify-center rounded-md p-0.75',
                'bg-tabs-list-background text-tabs-list-foreground',
                props.class,
            )
        "
        data-slot="tabs-list"
    >
        <slot />
    </TabsList>
</template>
