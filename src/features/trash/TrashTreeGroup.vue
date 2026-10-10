<script setup lang="ts">
import type { TrashGroup } from './use-trash-tree';
import type { NodeTreeDto } from '@/stores/nodes';

import TrashGroupHeader from './TrashGroupHeader.vue';
import TrashTreeItem from './TrashTreeItem.vue';

const props = defineProps<{ group: TrashGroup }>();
const emits = defineEmits<{
    'contextmenu:node': [event: MouseEvent, node: NodeTreeDto];
    'expand:group': [group: TrashGroup];
    'collapse:group': [group: TrashGroup];
}>();
const selected = defineModel<NodeTreeDto>();
const expanded = defineModel<string[]>('expanded', { required: true });

const open = computed({
    get: () => expanded.value.includes(props.group.id),
    set: (value: boolean) => {
        expanded.value = value
            ? [...expanded.value, props.group.id]
            : expanded.value.filter((id) => id !== props.group.id);
    },
});

function getChildren(node: NodeTreeDto) {
    return node.children.length ? node.children : undefined;
}
</script>

<template>
    <SidebarGroup :aria-label="group.name" class="h-full min-h-0 p-0" role="group">
        <TrashGroupHeader
            v-model="open"
            :group="group"
            @collapse:tree="emits('collapse:group', group)"
            @expand:tree="emits('expand:group', group)"
        />

        <SidebarGroupContent
            v-if="open"
            :id="group.id"
            class="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
            <ScrollArea
                class="min-h-0 flex-1 **:data-[slot=scroll-area-viewport]:p-1 **:data-[slot=scroll-area-viewport]:pb-6 **:data-[slot=scroll-area-viewport]:*:content-start"
            >
                <TreeRoot
                    v-slot="{ flattenItems }"
                    v-model="selected"
                    v-model:expanded="expanded"
                    :aria-label="group.name"
                    chevron
                    class="h-auto"
                    expand-on-chevron-only
                    :get-children="getChildren"
                    :get-key="(node: NodeTreeDto) => node.id"
                    indent-guide
                    :items="group.items"
                    selection-behavior="replace"
                >
                    <TrashTreeItem
                        v-for="item in flattenItems"
                        :key="item._id"
                        :item="item"
                        @contextmenu:node="(event, node) => emits('contextmenu:node', event, node)"
                    />
                </TreeRoot>
            </ScrollArea>
        </SidebarGroupContent>
    </SidebarGroup>
</template>
