<script setup lang="ts">
import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';

defineOptions({ inheritAttrs: false });

defineProps<{
    label: string;
    tooltip?: string;
}>();
</script>

<template>
    <TooltipWrapper>
        <Button
            v-bind="$attrs"
            :aria-label="label"
            class="size-7 text-editor-toolbar-foreground"
            size="icon"
            type="button"
            variant="ghost"
        >
            <slot />
        </Button>

        <template #tooltip>{{ tooltip ?? label }}</template>
    </TooltipWrapper>
</template>
