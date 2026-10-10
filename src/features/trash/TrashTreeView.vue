<script setup lang="ts">
import type { TrashGroup } from './use-trash-tree';
import type { NodeTreeDto } from '@/stores/nodes';

import TrashTreeGroup from './TrashTreeGroup.vue';

const props = defineProps<{ groups: TrashGroup[] }>();

const emits = defineEmits<{
    'contextmenu:node': [event: MouseEvent, node: NodeTreeDto];
    'expand:group': [group: TrashGroup];
    'collapse:group': [group: TrashGroup];
}>();

const selected = defineModel<NodeTreeDto>();
const expanded = defineModel<string[]>('expanded', { required: true });

const openGroupCount = computed(
    () => props.groups.filter((group) => expanded.value.includes(group.id)).length,
);
</script>

<template>
    <ResizablePanelGroup class="min-h-0 flex-1" direction="vertical" separation="divider">
        <template v-for="(group, index) in groups" :key="group.id">
            <ResizableHandle
                v-if="
                    index && expanded.includes(group.id) && expanded.includes(groups[index - 1]!.id)
                "
            />

            <ResizablePanel
                :class="
                    !expanded.includes(group.id)
                        ? 'flex-[0_0_1.5rem]!'
                        : openGroupCount === 1 && 'flex-1!'
                "
                :default-size="100 / groups.length"
                :min-size="10"
            >
                <TrashTreeGroup
                    v-model="selected"
                    v-model:expanded="expanded"
                    :group="group"
                    @collapse:group="emits('collapse:group', $event)"
                    @contextmenu:node="(event, node) => emits('contextmenu:node', event, node)"
                    @expand:group="emits('expand:group', $event)"
                />
            </ResizablePanel>
        </template>
    </ResizablePanelGroup>
</template>
