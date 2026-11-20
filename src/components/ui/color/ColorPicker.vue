<script setup lang="ts">
import type { Color } from 'reka-ui';

import { CheckIcon } from '@lucide/vue';
import { formatHex } from 'culori';
import {
    ColorAreaArea,
    ColorAreaRoot,
    ColorAreaThumb,
    ColorSliderRoot,
    ColorSliderThumb,
    ColorSliderTrack,
    convertToHsb,
    parseColor,
} from 'reka-ui';
import { computed, ref, shallowRef, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import ColorSwatch from './ColorSwatch.vue';

const props = defineProps<{ disabled?: boolean; initialColor?: string }>();
const emits = defineEmits<{ select: [color: string] }>();

const color = ref(formatHex(props.initialColor) ?? '#000000');
const hexInput = ref(color.value);
const areaSeed = shallowRef<{ key: symbol; hex: string; color: Color }>();

const areaColor = computed(() => {
    const seed = areaSeed.value;
    return seed?.hex === color.value ? seed.color : color.value;
});
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

function handleSliderUpdate(value: string | Color) {
    if (typeof value === 'string') {
        color.value = value;
    }
}

function handleSliderColor(value: Color) {
    const hsb = convertToHsb(parseColor(color.value));

    if (hsb.s === 0 && value.space !== 'rgb') {
        areaSeed.value = {
            key: Symbol(),
            hex: color.value,
            color: { ...hsb, h: value.h },
        };
    }
}
</script>

<template>
    <div class="flex flex-col gap-2" data-slot="color-picker">
        <ColorAreaRoot
            :key="areaSeed?.key"
            v-slot="{ style }"
            color-space="hsb"
            :disabled="disabled"
            :model-value="areaColor"
            x-channel="saturation"
            y-channel="brightness"
            @update:model-value="color = $event"
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
            channel="hue"
            class="relative flex h-4 w-full touch-none items-center select-none"
            color-space="hsb"
            :disabled="disabled"
            :model-value="color"
            @update:color="handleSliderColor"
            @update:model-value="handleSliderUpdate"
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
