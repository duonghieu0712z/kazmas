<script setup lang="ts">
import { Editor } from '@/features/editor';
import { NodeBreadcrumb } from '@/features/node-breadcrumb';
import { useNodeStore } from '@/stores/nodes';

const nodes = useNodeStore();
</script>

<template>
    <SidebarInset class="min-h-0 min-w-0 overflow-hidden">
        <header class="relative z-40 flex h-5 shrink-0 items-center border-b bg-background px-2">
            <NodeBreadcrumb />
        </header>
        <main class="min-h-0 min-w-0 flex-1 overflow-hidden p-1">
            <ResizablePanelGroup direction="horizontal" separation="divider">
                <ResizablePanel :default-size="65" :min-size="30">
                    <Editor v-if="nodes.openedNodeId" />
                </ResizablePanel>

                <ResizableHandle with-handle />

                <ResizablePanel :default-size="35" :min-size="20">
                    <ResizablePanelGroup direction="vertical" separation="divider">
                        <ResizablePanel :default-size="50" :min-size="20">
                            <div class="flex h-full items-center justify-center">
                                <span class="text-sm text-muted-foreground">Top panel</span>
                            </div>
                        </ResizablePanel>

                        <ResizableHandle with-handle />

                        <ResizablePanel :default-size="50" :min-size="20">
                            <div class="flex h-full items-center justify-center p-4">
                                <span class="text-sm text-muted-foreground">Bottom panel</span>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </main>
    </SidebarInset>
</template>
