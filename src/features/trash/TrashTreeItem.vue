<script setup lang="ts">
import type { NodeTreeDto } from '@/stores/nodes';
import type { FlattenedItem } from 'reka-ui';

import { getNodeIcon } from '@/lib/node-icons';
import { useNodeStore } from '@/stores/nodes';

defineProps<{ item: FlattenedItem<NodeTreeDto> }>();

const emits = defineEmits<{ 'contextmenu:node': [event: MouseEvent, node: NodeTreeDto] }>();

const nodes = useNodeStore();
</script>

<template>
    <TreeItem
        v-slot="{ isExpanded }"
        v-bind="item.bind"
        :aria-label="item.value.name"
        @contextmenu="emits('contextmenu:node', $event, item.value)"
    >
        <span class="inline-flex min-w-0 flex-1 items-center gap-2">
            <component :is="getNodeIcon(item.value.kind, isExpanded)" class="size-3.5 shrink-0" />

            <Tooltip>
                <TooltipTrigger as="span" class="min-w-0 flex-1 truncate">
                    {{ item.value.name }}
                </TooltipTrigger>

                <TooltipContent class="max-w-80 wrap-break-word" side="right">
                    {{ item.value.name }}
                </TooltipContent>
            </Tooltip>

            <Tooltip v-if="item.level === 1 && nodes.trashLocations.get(item.value.id)?.path">
                <TooltipTrigger
                    as="span"
                    class="ml-auto max-w-1/2 truncate text-[10px] text-muted-foreground"
                >
                    {{ nodes.trashLocations.get(item.value.id)?.path }}
                </TooltipTrigger>

                <TooltipContent class="max-w-80 wrap-break-word" side="right">
                    Original location: {{ nodes.trashLocations.get(item.value.id)?.path }}
                </TooltipContent>
            </Tooltip>
        </span>
    </TreeItem>
</template>
