<script setup lang="ts">
import { CopyCheckIcon, CopyIcon } from '@lucide/vue';
import { useClipboard } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';

const props = defineProps<{
    text: string;
}>();

const { copied, copy } = useClipboard({
    source: () => props.text,
    copiedDuring: 2000,
});

async function copyCode() {
    await copy();
}
</script>

<template>
    <TooltipWrapper class="flex size-6 items-center justify-center">
        <Button
            :aria-label="copied ? 'Copied' : 'Copy code'"
            class="size-6 bg-transparent text-muted-foreground shadow-none hover:text-interactive-foreground"
            size="icon"
            type="button"
            variant="ghost"
            @click="copyCode"
            @mousedown.prevent
        >
            <CopyCheckIcon v-if="copied" class="size-3" />
            <CopyIcon v-else class="size-3" />
        </Button>

        <template #tooltip>
            {{ copied ? 'Copied' : 'Copy code' }}
        </template>
    </TooltipWrapper>
</template>
