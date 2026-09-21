<script setup lang="ts">
import { CopyCheckIcon, CopyIcon } from '@lucide/vue';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { Button } from '@/components/ui/button';

const props = defineProps<{
    text: string;
}>();

const copied = ref(false);
let resetCopiedTimer: ReturnType<typeof setTimeout> | undefined;

async function copyCode() {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;

    clearTimeout(resetCopiedTimer);
    resetCopiedTimer = setTimeout(() => {
        copied.value = false;
    }, 2000);
}

onBeforeUnmount(() => {
    clearTimeout(resetCopiedTimer);
});
</script>

<template>
    <TooltipWrapper>
        <Button
            :aria-label="copied ? 'Copied' : 'Copy code'"
            class="size-7 bg-transparent text-muted-foreground shadow-none hover:text-foreground"
            size="icon"
            type="button"
            variant="ghost"
            @click="copyCode"
            @mousedown.prevent
        >
            <CopyCheckIcon v-if="copied" />
            <CopyIcon v-else />
        </Button>

        <template #tooltip>
            {{ copied ? 'Copied' : 'Copy code' }}
        </template>
    </TooltipWrapper>
</template>
