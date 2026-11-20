<script setup lang="ts">
import { CheckIcon } from '@lucide/vue';
import { formatHex } from 'culori';
import {
    ColorAreaArea,
    ColorAreaRoot,
    ColorAreaThumb,
    ColorSliderRoot,
    ColorSliderThumb,
    ColorSliderTrack,
} from 'reka-ui';
import { computed, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import ColorSwatch from './ColorSwatch.vue';

const props = defineProps<{ disabled?: boolean; initialColor?: string }>();
const emits = defineEmits<{ select: [color: string] }>();

const color = ref(formatHex(props.initialColor) ?? '#000000');
const hexInput = ref(color.value);
const isValid = computed(() => /^#[\da-f]{6}$/i.test(hexInput.value));

watch(color, (value) => {
    hexInput.value = value;
});

watch(hexInput, (value) => {
    if (isValid.value) {
        color.value = value;
    }
});

function handleSelect() {
    if (!props.disabled && isValid.value) {
        emits('select', color.value);
    }
}
</script>

<template>
    <div class="flex flex-col gap-2" data-slot="color-picker">
        <ColorAreaRoot
            v-slot="{ style }"
            v-model="color"
            color-space="hsb"
            :disabled="disabled"
            x-channel="saturation"
            y-channel="brightness"
        >
            <ColorAreaArea class="relative h-28 w-full rounded-sm" :style="style">
                <ColorAreaThumb
                    :class="[
                        'size-3 rounded-full border-2 outline-none',
                        'border-background ring-1 ring-foreground',
                        'focus-visible:ring-2 focus-visible:ring-focus-ring',
                    ]"
                />
            </ColorAreaArea>
        </ColorAreaRoot>

        <ColorSliderRoot
            v-model="color"
            channel="hue"
            class="relative flex h-4 w-full touch-none items-center select-none"
            color-space="hsb"
            :disabled="disabled"
        >
            <ColorSliderTrack class="h-2 w-full rounded-full" />
            <ColorSliderThumb
                :class="[
                    'block size-3 rounded-full border-2 outline-none',
                    'border-background bg-foreground ring-1 ring-foreground',
                    'focus-visible:ring-2 focus-visible:ring-focus-ring',
                ]"
            />
        </ColorSliderRoot>

        <div class="flex items-center gap-2">
            <ColorSwatch aria-hidden="true" as="span" :color="color" />
            <Input
                v-model="hexInput"
                :aria-invalid="!isValid"
                aria-label="Hex color"
                autocomplete="off"
                class="min-w-0 font-mono text-xs"
                :disabled="disabled"
                maxlength="7"
                spellcheck="false"
                @keydown.enter.prevent="handleSelect"
            />
            <Button
                aria-label="Apply"
                :disabled="disabled || !isValid"
                size="icon"
                variant="ghost"
                @click="handleSelect"
            >
                <CheckIcon aria-hidden="true" />
            </Button>
        </div>
    </div>
</template>
