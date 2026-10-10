<script setup lang="ts">
import type { AlertDialogTriggerProps } from 'reka-ui';

import { AlertDialogTrigger } from 'reka-ui';

const props = withDefaults(defineProps<AlertDialogTriggerProps>(), { as: 'div' });
</script>

<template>
    <AlertDialogTrigger data-slot="alert-dialog-trigger" v-bind="props">
        <slot />
    </AlertDialogTrigger>
</template>
