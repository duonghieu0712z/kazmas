<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { unrefElement } from '@vueuse/core';
import {
    injectComboboxRootContext,
    injectDropdownMenuRootContext,
    injectPopoverRootContext,
} from 'reka-ui';
import { computed, ref, useTemplateRef, watch } from 'vue';

import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const props = withDefaults(
    defineProps<{
        class?: HTMLAttributes['class'];
        showTooltip?: boolean;
        showShortcut?: boolean;
        shortcutKeys?: string[];
    }>(),
    {
        showTooltip: true,
        showShortcut: false,
    },
);

const tooltipTrigger = useTemplateRef<InstanceType<typeof TooltipTrigger>>('tooltipTrigger');
const popupContexts = [
    injectPopoverRootContext(null),
    injectDropdownMenuRootContext(null),
    injectComboboxRootContext(null),
];

const disabled = computed(() => {
    const element = unrefElement(tooltipTrigger);

    if (!element) {
        return false;
    }

    return popupContexts.some((context) => {
        const trigger = context?.triggerElement.value;

        return (
            !!context?.open.value &&
            !!trigger &&
            (trigger.contains(element) || element.contains(trigger))
        );
    });
});

const requestedOpen = ref(false);
const open = computed({
    get: () => !disabled.value && requestedOpen.value,
    set: (value: boolean) => {
        requestedOpen.value = value;
    },
});

watch(
    disabled,
    () => {
        requestedOpen.value = false;
    },
    { flush: 'sync' },
);
</script>

<template>
    <Tooltip v-if="showTooltip" v-model:open="open" :disabled="disabled || undefined">
        <TooltipTrigger ref="tooltipTrigger" :class="props.class">
            <slot />
        </TooltipTrigger>

        <TooltipContent class="flex items-center gap-2" side="bottom">
            <slot name="tooltip" />
            <KbdGroup v-if="showShortcut && shortcutKeys">
                <Kbd v-for="key in shortcutKeys" :key="key">{{ key }}</Kbd>
            </KbdGroup>
        </TooltipContent>
    </Tooltip>

    <slot v-else />
</template>
