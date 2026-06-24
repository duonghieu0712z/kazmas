<script setup lang="ts">
import { FolderOpenIcon } from '@lucide/vue';
import { open } from '@tauri-apps/plugin-dialog';

import { EXTENSION } from '@/generated/bindings';

type NewWorldDialogResult = {
    name: string;
    path: string;
};

const emit = defineEmits<{
    'close:dialog': [];
    'resolve:dialog': [result: NewWorldDialogResult];
}>();

const name = ref('New World');
const path = ref('');

const canCreate = computed(() => name.value.trim().length > 0 && path.value.length > 0);

async function browsePath() {
    const selected = await open({
        title: 'New World',
        multiple: false,
        directory: true,
        canCreateDirectories: true,
    });

    if (typeof selected === 'string') {
        path.value = selected;
    }
}

function createWorld() {
    if (!canCreate.value) {
        return;
    }

    emit('resolve:dialog', {
        name: name.value.trim(),
        path: path.value,
    });
}
</script>

<template>
    <DialogContent class="sm:max-w-md">
        <div class="grid gap-4">
            <DialogHeader>
                <DialogTitle>New World</DialogTitle>
                <DialogDescription>Create a world and choose where it is saved.</DialogDescription>
            </DialogHeader>

            <div class="grid gap-3">
                <div class="grid grid-cols-[6rem_1fr] items-center gap-2">
                    <Label for="new-world-name">World Name</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="new-world-name"
                            v-model="name"
                            autocomplete="off"
                            autofocus
                            @keydown.enter="createWorld"
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupText>.{{ EXTENSION }}</InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                </div>

                <div class="grid grid-cols-[6rem_1fr] items-center gap-2">
                    <Label for="new-world-path">Save Location</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="new-world-path"
                            v-model="path"
                            placeholder="Choose a folder"
                            readonly
                        />
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton size="icon" @click="browsePath">
                                <FolderOpenIcon />
                                <span class="sr-only">Browse</span>
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="emit('close:dialog')">Cancel</Button>
                <Button :disabled="!canCreate" @click="createWorld">Create</Button>
            </DialogFooter>
        </div>
    </DialogContent>
</template>
