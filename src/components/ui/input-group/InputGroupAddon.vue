<script setup lang="ts">
import type { InputGroupVariants } from '.';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

import { inputGroupAddonVariants } from '.';

const props = withDefaults(
    defineProps<{
        align?: InputGroupVariants['align'];
        class?: HTMLAttributes['class'];
    }>(),
    {
        align: 'inline-start',
    },
);

function handleInputGroupAddonClick(e: MouseEvent) {
    const currentTarget = e.currentTarget as HTMLElement | null;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button')) {
        return;
    }
    if (currentTarget?.parentElement) {
        const control = currentTarget.parentElement.querySelector<
            HTMLInputElement | HTMLTextAreaElement
        >('[data-slot="input-group-control"], input, textarea');
        if (control && !control.disabled) {
            control.focus();
        }
    }
}
</script>

<template>
    <div
        :class="cn(inputGroupAddonVariants({ align }), props.class)"
        :data-align="align"
        data-slot="input-group-addon"
        role="group"
        @click="handleInputGroupAddonClick"
    >
        <slot />
    </div>
</template>
