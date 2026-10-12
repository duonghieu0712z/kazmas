<script setup lang="ts">
import type { PopoverTriggerProps } from 'reka-ui';

import { PopoverTrigger } from 'reka-ui';

const props = withDefaults(defineProps<PopoverTriggerProps>(), { as: 'div' });
</script>

<template>
    <PopoverTrigger data-slot="popover-trigger" v-bind="props">
        <slot />
    </PopoverTrigger>
</template>
