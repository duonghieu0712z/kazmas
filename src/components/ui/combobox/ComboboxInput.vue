<script setup lang="ts">
import type { ComboboxInputEmits, ComboboxInputProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { SearchIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxInput, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

defineOptions({
    inheritAttrs: false,
});

const props = defineProps<
    ComboboxInputProps & {
        class?: HTMLAttributes['class'];
    }
>();

const emits = defineEmits<ComboboxInputEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <div class="flex h-9 items-center gap-2 border-b px-3" data-slot="command-input-wrapper">
        <SearchIcon class="size-4 shrink-0 opacity-50" />
        <ComboboxInput
            :class="
                cn(
                    'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-input-placeholder',
                    'disabled:cursor-not-allowed disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground!',
                    props.class,
                )
            "
            data-slot="command-input"
            v-bind="{ ...$attrs, ...forwarded }"
        >
            <slot />
        </ComboboxInput>
    </div>
</template>
