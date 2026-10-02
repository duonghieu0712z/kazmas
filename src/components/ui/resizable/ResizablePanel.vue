<script setup lang="ts">
import type { SplitterPanelEmits, SplitterPanelProps } from 'reka-ui';

import { SplitterPanel, useForwardExpose, useForwardPropsEmits } from 'reka-ui';

import { injectResizableContext } from './context';

const props = defineProps<SplitterPanelProps>();
const emits = defineEmits<SplitterPanelEmits>();

const forwarded = useForwardPropsEmits(props, emits);
const { forwardRef } = useForwardExpose();
const { appearance } = injectResizableContext();
</script>

<template>
    <SplitterPanel
        :ref="forwardRef"
        v-slot="slotProps"
        class="data-[appearance=boxed]:not-has-data-[slot=resizable-panel]:rounded-sm data-[appearance=boxed]:not-has-data-[slot=resizable-panel]:border"
        :data-appearance="appearance"
        data-slot="resizable-panel"
        v-bind="forwarded"
    >
        <slot v-bind="slotProps" />
    </SplitterPanel>
</template>
