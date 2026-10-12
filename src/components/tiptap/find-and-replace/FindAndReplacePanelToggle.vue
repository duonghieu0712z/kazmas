<script setup lang="ts">
import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Toggle } from '@/components/ui/toggle';

defineOptions({ inheritAttrs: false });

defineProps<{
    label: string;
}>();
</script>

<template>
    <TooltipWrapper>
        <Toggle
            v-bind="$attrs"
            :aria-label="label"
            class="size-6 text-editor-toolbar-foreground"
            size="icon"
        >
            <slot />
        </Toggle>

        <template #tooltip>{{ label }}</template>
    </TooltipWrapper>
</template>
