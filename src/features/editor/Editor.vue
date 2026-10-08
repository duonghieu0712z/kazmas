<script setup lang="ts">
import type { Content } from '@tiptap/vue-3';

import { createEditorOptions } from '@/components/tiptap/editor';
import { commands } from '@/generated/bindings';
import { createDocumentSaveQueue } from '@/lib/document-saves';
import { useNodeStore } from '@/stores/nodes';
import { useWorldStore } from '@/stores/world';

import EditorToolbar from './EditorToolbar.vue';
import { createEditorExtensions } from './options';

const props = withDefaults(defineProps<{ nodeId?: string; active?: boolean }>(), { active: true });

const emits = defineEmits<{
    'error:save': [];
}>();

const world = useWorldStore();
const nodes = useNodeStore();
const openedNodeId = computed(() => props.nodeId ?? nodes.openedNodeId);

const saveError = shallowRef<string>();
const document = shallowRef<{ nodeId: string; content: Content }>();
const emptyDocument: Content = { type: 'doc' };

const saves = createDocumentSaveQueue(commands.updateDocument, reportSaveError);

function reportSaveError(error: Error) {
    saveError.value = error.message;
    if (!props.active) {
        emits('error:save');
    }
}

async function flushDocumentSave() {
    try {
        await saves.flush();
        saveError.value = undefined;
    } catch (error) {
        reportSaveError(error instanceof Error ? error : new Error(String(error)));
    }
}

async function prepareClose() {
    try {
        await saves.flush();
        saveError.value = undefined;
        return true;
    } catch (error) {
        reportSaveError(error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}

defineExpose({ prepareClose });

watch(
    () => props.active,
    (active) => {
        if (!active) {
            void flushDocumentSave();
        }
    },
);

const options = computed(() =>
    createEditorOptions({
        content: document.value?.content,
        autofocus: props.active ? 'end' : false,
        extensions: createEditorExtensions(),
        onUpdate: ({ editor }) => {
            const nodeId = document.value?.nodeId;
            if (nodeId) {
                saveError.value = undefined;
                world.markDirty();
                saves.schedule(nodeId, JSON.stringify(editor.getJSON()));
            }
        },
        onDestroy: flushDocumentSave,
    }),
);

watch(
    openedNodeId,
    async (nodeId) => {
        const save = flushDocumentSave();
        document.value = undefined;
        await save;
        if (!nodeId) {
            return;
        }

        try {
            const result = await commands.getDocument(nodeId);
            if (result.status === 'error') {
                throw new Error('Document could not be loaded.');
            }
            if (openedNodeId.value === nodeId && result.status === 'ok') {
                document.value = {
                    nodeId,
                    content: result.data ? JSON.parse(result.data) : emptyDocument,
                };
            }
        } catch {
            if (openedNodeId.value === nodeId) {
                saveError.value = 'Document could not be loaded.';
            }
        }
    },
    { immediate: true },
);

onBeforeUnmount(async () => {
    try {
        await saves.dispose();
    } catch (error) {
        reportSaveError(error instanceof Error ? error : new Error(String(error)));
    }
});
</script>

<template>
    <div class="relative flex h-full min-w-0 flex-col overflow-hidden">
        <p v-if="saveError" class="px-2 py-1 text-sm text-destructive" role="alert">
            {{ saveError }}
        </p>
        <EditorProvider v-if="document" :key="document.nodeId" :options="options">
            <EditorToolbar />

            <ScrollArea class="min-h-0 min-w-0 flex-1 overflow-hidden" orientation="both">
                <div class="flex min-h-full w-full min-w-max items-stretch justify-center p-2">
                    <EditorContent
                        class="w-3xl shrink-0 cursor-text self-stretch border border-editor-border"
                    />
                </div>
            </ScrollArea>

            <Teleport v-if="active" defer to="#app-status-bar">
                <CharacterCountIndicator />
            </Teleport>
        </EditorProvider>
    </div>
</template>
