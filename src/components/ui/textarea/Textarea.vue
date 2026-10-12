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
                'flex field-sizing-content min-h-18 w-full rounded-sm border px-2 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                'border-input-border bg-transparent',
                'placeholder:text-input-placeholder',
                'focus-visible:border-focus-ring focus-visible:ring-[1.5px] focus-visible:ring-focus-ring/50',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
                'disabled:cursor-not-allowed disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground!',
                props.class,
            )
        "
        data-slot="textarea"
    />
</template>
