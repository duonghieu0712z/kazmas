<script setup lang="ts">
import type { SplitterPanelEmits, SplitterPanelProps } from 'reka-ui';

import { SplitterPanel, useForwardExpose, useForwardPropsEmits } from 'reka-ui';

import { injectResizableContext } from './context';

const props = defineProps<SplitterPanelProps>();
const emits = defineEmits<SplitterPanelEmits>();

const forwarded = useForwardPropsEmits(props, emits);
const { forwardRef } = useForwardExpose();
const { separation } = injectResizableContext();
</script>

<template>
    <SplitterPanel
        :ref="forwardRef"
        v-slot="slotProps"
        class="data-[separation=gap]:not-has-[>[data-slot=resizable-panel-group]]:rounded-md data-[separation=gap]:not-has-[>[data-slot=resizable-panel-group]]:border"
        :data-separation="separation"
        data-slot="resizable-panel"
        v-bind="forwarded"
    >
        <slot v-bind="slotProps" />
    </SplitterPanel>
</template>
