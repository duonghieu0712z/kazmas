<script setup lang="ts">
import type { TextColorPresetProps } from '.';

import { CaseSensitiveIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';

import { TooltipWrapper } from '@/components/tiptap/tooltip';
import { ColorSwatch } from '@/components/ui/color';
import { Toggle } from '@/components/ui/toggle';

const props = withDefaults(defineProps<TextColorPresetProps>(), {
    variant: 'default',
    showTooltip: true,
});

const emits = defineEmits<{ select: [] }>();

const delegatedProps = reactiveOmit(props, 'preset', 'active', 'showTooltip');
</script>

<template>
    <TooltipWrapper :show-tooltip="showTooltip">
        <Toggle
            v-bind="delegatedProps"
            :aria-label="preset.textColor ? `${preset.label} highlight` : preset.label"
            :model-value="active"
            size="icon"
            @click="emits('select')"
            @mousedown.prevent
        >
            <slot>
                <ColorSwatch
                    aria-hidden="true"
                    as="span"
                    :color="preset.color"
                    :style="{ color: preset.textColor }"
                >
                    <CaseSensitiveIcon v-if="preset.textColor" />
                </ColorSwatch>
            </slot>
        </Toggle>

        <template #tooltip>{{ preset.label }}</template>
    </TooltipWrapper>
</template>
