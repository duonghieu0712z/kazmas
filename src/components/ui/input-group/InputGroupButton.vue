<script setup lang="ts">
import type { InputGroupButtonProps } from '.';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { inputGroupButtonVariants } from '.';

const props = withDefaults(defineProps<InputGroupButtonProps>(), {
    variant: 'ghost',
    size: 'default',
});
</script>

<template>
    <Button
        :class="cn(inputGroupButtonVariants({ size }), props.class)"
        :data-size="size"
        :variant="variant"
    >
        <slot />
    </Button>
</template>
