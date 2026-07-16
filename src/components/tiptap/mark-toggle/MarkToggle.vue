<script setup lang="ts">
import type { MarkToggleProps } from '.';

import { Toggle } from '@/components/ui/toggle';

import { useMark } from '.';

const props = defineProps<MarkToggleProps>();

const { canToggle, icon } = useMark(props);
</script>

<template>
    <Toggle :disabled="!canToggle">
        <component :is="icon" />
    </Toggle>
</template>
