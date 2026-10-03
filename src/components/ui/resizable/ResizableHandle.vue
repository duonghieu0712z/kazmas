<script setup lang="ts">
import type { SplitterResizeHandleEmits, SplitterResizeHandleProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { EllipsisVerticalIcon, GripVerticalIcon } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { SplitterResizeHandle, useForwardPropsEmits } from 'reka-ui';

import { cn } from '@/lib/utils';

import { resizableHandleVariants } from '.';
import { injectResizableContext } from './context';

const props = defineProps<
    SplitterResizeHandleProps & { class?: HTMLAttributes['class']; withHandle?: boolean }
>();
const emits = defineEmits<SplitterResizeHandleEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'withHandle');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
const { separation, orientation } = injectResizableContext();
</script>

<template>
    <SplitterResizeHandle
        v-bind="forwarded"
        :class="cn(resizableHandleVariants({ separation, orientation }), props.class)"
        :data-separation="separation"
        data-slot="resizable-handle"
    >
        <template v-if="props.withHandle">
            <div class="z-10">
                <slot>
                    <GripVerticalIcon
                        v-if="separation === 'divider'"
                        class="size-3 stroke-ring/50"
                    />
                    <EllipsisVerticalIcon v-else class="size-3 stroke-ring/50" />
                </slot>
            </div>
        </template>
    </SplitterResizeHandle>
</template>
