<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { XIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { DialogClose, DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

import DialogOverlay from './DialogOverlay.vue';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<
        DialogContentProps & { class?: HTMLAttributes['class']; showCloseButton?: boolean }
    >(),
    {
        showCloseButton: true,
    },
);
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <DialogPortal>
        <DialogOverlay />
        <DialogContent
            v-bind="{ ...$attrs, ...forwarded }"
            :class="
                cn(
                    'bg-background fixed z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-sm border p-6 shadow-xs duration-200 sm:max-w-lg',
                    'data-[state=open]:animate-in data-[state=open]:fade-in-0 :zoom-out-95 data-[state=open]:zoom-in-95',
                    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]',
                    'top-[50%] left-[50%]',
                    props.class,
                )
            "
            data-slot="dialog-content"
        >
            <slot />

            <DialogClose
                v-if="showCloseButton"
                :class="[
                    'ring-offset-background absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none',
                    'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden',
                    'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
                    `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
                ]"
                data-slot="dialog-close"
            >
                <XIcon />
                <span class="sr-only">Close</span>
            </DialogClose>
        </DialogContent>
    </DialogPortal>
</template>
