<script setup lang="ts">
import { useNodeDrag } from '@/features/node-tree';
import { getNodeIcon } from '@/lib/node-icons';

import AppStatusBar from './AppStatusBar.vue';
import AppTitleBar from './AppTitleBar.vue';
import AppWorkspace from './AppWorkspace.vue';

const TITLE_BAR_HEIGHT = '2rem';
const STATUS_BAR_HEIGHT = '1.5rem';
const drag = useNodeDrag();
</script>

<template>
    <SidebarProvider
        class="h-full min-h-0 flex-col overflow-hidden"
        :style="{
            '--title-bar-height': TITLE_BAR_HEIGHT,
            '--status-bar-height': STATUS_BAR_HEIGHT,
        }"
    >
        <AppTitleBar />
        <AppWorkspace />
        <AppStatusBar />

        <Teleport to="body">
            <div
                v-if="drag.draggedNode"
                aria-hidden="true"
                class="pointer-events-none fixed z-100 flex h-6 max-w-64 items-center gap-2 rounded-md bg-popup-background px-2 text-xs text-popup-foreground shadow-lg"
                data-slot="node-drag-preview"
                :style="{ left: `${drag.position.x + 12}px`, top: `${drag.position.y + 12}px` }"
            >
                <component :is="getNodeIcon(drag.draggedNode.kind)" class="size-3.5 shrink-0" />
                <span class="truncate">{{ drag.draggedNode.name }}</span>
            </div>
        </Teleport>
        <p
            v-if="drag.error"
            class="fixed right-2 bottom-6 z-50 rounded-md bg-popup-background p-2 text-xs text-destructive shadow-lg"
            role="alert"
        >
            {{ drag.error }}
        </p>
    </SidebarProvider>
</template>
