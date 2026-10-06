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
                'inline-flex h-9 w-fit items-center justify-center rounded-md bg-tabs-list-background p-0.75 text-tabs-list-foreground',
                props.class,
            )
        "
        data-slot="tabs-list"
    >
        <slot />
    </TabsList>
</template>
