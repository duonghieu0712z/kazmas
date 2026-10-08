<script setup lang="ts">
import { commands } from '@/generated/bindings';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

const props = defineProps<{ payload: { nodeId: string; worldId: string; name: string } }>();
const emit = defineEmits<{ 'close:dialog': []; 'resolve:dialog': [name: string] }>();
const nodes = useNodeStore();
const world = useWorldStore();
const name = ref(props.payload.name);
const saving = ref(false);
const error = ref('');
const canRename = computed(
    () => !!name.value.trim() && name.value.trim() !== props.payload.name && !saving.value,
);

watch(
    () => world.manifest?.id,
    (id) => {
        if (id !== props.payload.worldId) {
            emit('close:dialog');
        }
    },
);

function selectName(event: FocusEvent) {
    if (event.target instanceof HTMLInputElement) {
        event.target.select();
    }
}

function preventWhileSaving(event: Event) {
    if (saving.value) {
        event.preventDefault();
    }
}

async function renameNode(event?: KeyboardEvent) {
    if (event?.isComposing || !canRename.value || world.manifest?.id !== props.payload.worldId) {
        return;
    }
    const node = nodes.getNode(props.payload.nodeId);
    if (!node) {
        return;
    }
    saving.value = true;
    error.value = '';
    const nextName = name.value.trim();
    let renamed = false;
    try {
        const result = await world.trackCreation(
            commands.updateNode({ id: node.id, parentId: node.parentId, name: nextName }),
        );
        if (world.manifest?.id !== props.payload.worldId) {
            return;
        }
        if (result.status !== 'ok' || result.data !== true) {
            error.value = 'The item could not be renamed.';
            return;
        }
        renamed = true;
        world.markDirty();
        await nodes.reloadNodes();
        if (world.manifest?.id !== props.payload.worldId) {
            return;
        }
        if (nodes.getNode(node.id)?.name !== nextName) {
            error.value = 'The item was renamed, but the tree could not be refreshed.';
            return;
        }
        emit('resolve:dialog', nextName);
    } catch {
        if (world.manifest?.id === props.payload.worldId) {
            error.value = renamed
                ? 'The item was renamed, but the tree could not be refreshed.'
                : 'The item could not be renamed.';
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <DialogContent
        class="sm:max-w-sm"
        @escape-key-down="preventWhileSaving"
        @interact-outside="preventWhileSaving"
    >
        <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>Enter a new name for this item.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-2">
            <Label for="rename-node-name">Name</Label>
            <Input
                id="rename-node-name"
                v-model="name"
                autocomplete="off"
                autofocus
                :disabled="saving"
                @focus="selectName"
                @keydown.enter.prevent="renameNode"
            />
            <p v-if="error" class="text-xs text-destructive" role="alert">{{ error }}</p>
        </div>
        <DialogFooter>
            <Button :disabled="saving" variant="outline" @click="emit('close:dialog')"
                >Cancel</Button
            >
            <Button :disabled="!canRename" @click="renameNode()">Rename</Button>
        </DialogFooter>
    </DialogContent>
</template>
