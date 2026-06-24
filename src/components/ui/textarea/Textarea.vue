<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { useVModel } from '@vueuse/core';

import { cn } from '@/lib/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
    defaultValue?: string | number;
    modelValue?: string | number;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
    passive: true,
    defaultValue: props.defaultValue,
});
</script>

<template>
    <textarea
        v-model="modelValue"
        :class="
            cn(
                'border-input placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content min-h-18 w-full rounded-sm border bg-transparent px-2 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-[1.5px]',
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                'disabled:cursor-not-allowed disabled:opacity-50',
                props.class,
            )
        "
        data-slot="textarea"
    />
</template>
