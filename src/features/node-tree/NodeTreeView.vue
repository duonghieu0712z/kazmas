<script setup lang="ts">
import type { NodeDraft } from './use-create-node';
import type { NodeTreeSection } from './use-node-tree';
import type { NodeTreeDto } from '@/stores/nodes';
import type { TreeItemSelectEvent } from 'reka-ui';

import { FileIcon, FolderIcon, FolderOpenIcon } from '@lucide/vue';
import { useEventListener } from '@vueuse/core';

import { useNodeStore } from '@/stores/nodes';

import NodeTreeLabel from './NodeTreeLabel.vue';
import { useCreateNode } from './use-create-node';

type TreeNode = NodeTreeDto | NodeDraft;

const props = defineProps<{ tree: NodeTreeDto[]; section: NodeTreeSection }>();
const emits = defineEmits<{
    'create:node': [id: string];
}>();
const draft = defineModel<NodeDraft | null>('draft', { default: null });
const creating = defineModel<boolean>('creating', { default: false });
const { createName, createError, cancelName, submitName } = useCreateNode(props, draft, creating);

async function createNode() {
    const id = await submitName();
    if (id) {
        emits('create:node', id);
    }
}

async function enterName(event: KeyboardEvent) {
    if (event.isComposing) {
        return;
    }
    event.preventDefault();
    await createNode();
}

async function finishName() {
    if (createName.value.trim()) {
        await createNode();
    } else {
        cancelName();
    }
}

async function blurName(event?: FocusEvent) {
    if (!event) {
        await finishName();
        return;
    }
    const input = event.target;
    await nextTick();
    if (input instanceof HTMLInputElement && input.isConnected) {
        await finishName();
    }
}

const selected = defineModel<NodeTreeDto>();
const expanded = defineModel<string[]>('expanded', { default: () => [] });
const nodes = useNodeStore();
let nameInput: HTMLInputElement | null = null;
let focusedDraft: NodeDraft | null = null;

useEventListener(document, 'pointerdown', async (event) => {
    if (draft.value && !(event.target instanceof Node && nameInput?.contains(event.target))) {
        await blurName();
    }
});

const items = computed<TreeNode[]>(() => {
    const pending = draft.value;
    return pending &&
        (!pending.parentId || props.tree.some((node) => node.parentId === pending.parentId))
        ? [...props.tree, pending]
        : props.tree;
});

function getKey(node: TreeNode) {
    return node.id;
}

function getChildren(node: TreeNode): TreeNode[] | undefined {
    if (node.kind === 'draft') {
        return;
    }
    const pending = draft.value;
    const children =
        pending && pending.parentId === node.id ? [...node.children, pending] : node.children;
    return children.length ? children : undefined;
}

function selectNode(event: TreeItemSelectEvent<TreeNode>) {
    const node = event.detail.value;
    if (node?.kind === 'draft') {
        event.preventDefault();
    } else if (node) {
        nodes.selectNode(node);
        nodes.openNode(node);
    }
}

function focusName(element: Element | ComponentPublicInstance | null) {
    const input = element instanceof Element ? element : element?.$el;
    nameInput = input instanceof HTMLInputElement ? input : null;
    nextTick(() => {
        if (
            input instanceof HTMLInputElement &&
            input.isConnected &&
            !creating.value &&
            draft.value !== focusedDraft
        ) {
            focusedDraft = draft.value;
            input.focus();
            input.scrollIntoView?.({ block: 'nearest' });
        }
    });
}
</script>

<template>
    <ScrollArea
        class="min-h-0 min-w-0 flex-1 **:data-[slot=scroll-area-viewport]:p-1"
        viewport-as-child
    >
        <TreeRoot
            v-model="selected"
            v-model:expanded="expanded"
            :aria-label="section"
            as-child
            chevron
            class="h-auto"
            expand-on-chevron-only
            :get-children="getChildren"
            :get-key="getKey"
            indent-guide
            :items="items"
            selection-behavior="replace"
        >
            <TreeVirtualizer
                v-slot="{ item }"
                :estimate-size="20"
                :overscan="8"
                :scroll-to-key="draft?.id ?? selected?.id"
                :text-content="(node: TreeNode) => (node.kind === 'draft' ? createName : node.name)"
            >
                <TreeItem
                    v-bind="item.bind"
                    :key="item._id"
                    v-slot="{ isExpanded }"
                    @select="selectNode"
                >
                    <span class="inline-flex min-w-0 flex-1 items-center gap-2">
                        <template
                            v-if="
                                item.value.kind === 'folder' ||
                                (item.value.kind === 'draft' && item.value.type === 'folder')
                            "
                        >
                            <FolderOpenIcon v-if="isExpanded" class="size-3.5 shrink-0" />
                            <FolderIcon v-else class="size-3.5 shrink-0" />
                        </template>
                        <FileIcon v-else class="size-3.5 shrink-0" />

                        <Input
                            v-if="item.value.kind === 'draft'"
                            :ref="focusName"
                            v-model="createName"
                            aria-label="New item name"
                            class="h-4 min-w-0 flex-1 rounded-xs bg-background px-1 text-xs text-foreground shadow-none focus-visible:ring-0 md:text-xs"
                            :disabled="creating"
                            placeholder="Untitled"
                            @blur="blurName"
                            @click.stop
                            @keydown.enter="enterName"
                            @keydown.esc.prevent="cancelName"
                            @keydown.stop
                        />
                        <NodeTreeLabel v-else :name="item.value.name" />
                    </span>
                </TreeItem>
            </TreeVirtualizer>
        </TreeRoot>
    </ScrollArea>
    <div v-if="createError" class="px-3 py-2 text-xs text-destructive" role="alert">
        {{ createError }}
    </div>
</template>
