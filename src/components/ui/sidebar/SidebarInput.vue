<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <Input
        :class="cn('h-8 w-full bg-background shadow-none', props.class)"
        data-sidebar="input"
        data-slot="sidebar-input"
    >
        <slot />
    </Input>
</template>
