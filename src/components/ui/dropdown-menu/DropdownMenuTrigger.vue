<script setup lang="ts">
import type { DropdownMenuTriggerProps } from 'reka-ui';

import { DropdownMenuTrigger, useForwardProps } from 'reka-ui';

const props = withDefaults(defineProps<DropdownMenuTriggerProps>(), { as: 'div' });

const forwardedProps = useForwardProps(props);
</script>

<template>
    <DropdownMenuTrigger data-slot="dropdown-menu-trigger" v-bind="forwardedProps">
        <slot />
    </DropdownMenuTrigger>
</template>
