<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';

import { useResizeObserver } from '@vueuse/core';

import { sidebarPreferences, useSidebar } from '@/components/ui/sidebar';

import AppContent from './AppContent.vue';
import AppSidebar from './AppSidebar.vue';

interface SidebarPanel {
    $el: HTMLElement;
    collapse: () => void;
    resize: (size: number) => void;
}

const { open, setOpen } = useSidebar();

const workspace = useTemplateRef<ComponentPublicInstance>('workspace');
const sidebarPanel = useTemplateRef<SidebarPanel>('sidebarPanel');

const isResizing = ref(false);
const workspaceWidth = ref(1200);
const panelScale = ref(1);
const sidebarBorderWidth = ref(2);
const activityBarWidth = ref(41);
const activityBarBorderWidth = ref(1);

const fixedSidebarWidth = computed(() => activityBarWidth.value + sidebarBorderWidth.value);
const collapsedWidth = computed(() => fixedSidebarWidth.value - activityBarBorderWidth.value);
const collapsedSidebarSize = computed(() => toPanelSize(collapsedWidth.value));
const lastExpandedSize = computed({
    get: () => sidebarPreferences.value.width + fixedSidebarWidth.value,
    set: (width: number) => {
        sidebarPreferences.value.width = width - fixedSidebarWidth.value;
    },
});
const minExpandedWidth = computed(() => fixedSidebarWidth.value + 160);
const maxExpandedWidth = computed(
    () => fixedSidebarWidth.value + Math.max(160, workspaceWidth.value * 0.4),
);
const minSidebarSize = computed(() => toPanelSize(minExpandedWidth.value));
const maxSidebarSize = computed(() => toPanelSize(maxExpandedWidth.value));

function toPanelSize(width: number) {
    return (width - sidebarBorderWidth.value) / panelScale.value;
}

function rememberSidebarSize() {
    lastExpandedSize.value =
        sidebarPanel.value?.$el.getBoundingClientRect().width ?? lastExpandedSize.value;
}

function restoreSidebarSize() {
    lastExpandedSize.value = Math.min(
        Math.max(lastExpandedSize.value, minExpandedWidth.value),
        maxExpandedWidth.value,
    );
    sidebarPanel.value?.resize(toPanelSize(lastExpandedSize.value));
}

useResizeObserver(workspace, ([entry]) => {
    if (!entry || entry.contentRect.width <= 0) {
        return;
    }

    const panels = Array.from(entry.target.children).filter((element) =>
        element.hasAttribute('data-panel'),
    );
    const panelContentWidth = panels.reduce((width, element) => {
        const style = getComputedStyle(element);
        return (
            width +
            element.getBoundingClientRect().width -
            parseFloat(style.borderLeftWidth) -
            parseFloat(style.borderRightWidth)
        );
    }, 0);

    if (panelContentWidth <= 0) {
        return;
    }

    workspaceWidth.value = entry.contentRect.width;
    panelScale.value = panelContentWidth / workspaceWidth.value;
    const sidebarStyle = panels[0] ? getComputedStyle(panels[0]) : undefined;
    sidebarBorderWidth.value = sidebarStyle
        ? parseFloat(sidebarStyle.borderLeftWidth) + parseFloat(sidebarStyle.borderRightWidth)
        : 0;
    const activityBar = panels[0]?.querySelector('[data-slot=sidebar-content]')?.parentElement;
    if (activityBar) {
        activityBarWidth.value = activityBar.getBoundingClientRect().width;
        activityBarBorderWidth.value = parseFloat(getComputedStyle(activityBar).borderRightWidth);
    }
    nextTick(() => {
        if (open.value) {
            restoreSidebarSize();
        } else {
            sidebarPanel.value?.collapse();
        }
    });
});

function handleSidebarDragging(dragging: boolean) {
    if (open.value) {
        rememberSidebarSize();
    }

    isResizing.value = dragging;
}

function handleSidebarResize(size: number) {
    if (isResizing.value) {
        setOpen(size > collapsedSidebarSize.value + 0.01);
    }
}

function handleResizeKeydown(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(event.key)) {
        return;
    }

    handleSidebarDragging(true);
    nextTick(() => {
        handleSidebarDragging(false);
    });
}

watch(open, (value) => {
    if (isResizing.value) {
        return;
    }

    if (value) {
        restoreSidebarSize();
    } else {
        rememberSidebarSize();
        sidebarPanel.value?.collapse();
    }
});
</script>

<template>
    <ResizablePanelGroup
        ref="workspace"
        v-slot="{ layout }"
        class="h-auto min-h-0 min-w-0 flex-1 overflow-hidden p-1"
        direction="horizontal"
        separation="gap"
    >
        <ResizablePanel
            ref="sidebarPanel"
            class="min-h-0 min-w-0 overflow-hidden"
            :class="
                open
                    ? 'max-w-(--sidebar-max-width) min-w-(--sidebar-min-width)'
                    : 'flex-[0_0_var(--sidebar-collapsed-width)]!'
            "
            :collapsed-size="collapsedSidebarSize"
            collapsible
            :default-size="open ? toPanelSize(lastExpandedSize) : collapsedSidebarSize"
            :max-size="maxSidebarSize"
            :min-size="minSidebarSize"
            size-unit="px"
            :style="{
                flexGrow: layout[0],
                '--sidebar-collapsed-width': `${collapsedWidth}px`,
                '--sidebar-min-width': `${minExpandedWidth}px`,
                '--sidebar-max-width': `${maxExpandedWidth}px`,
            }"
            @resize="handleSidebarResize"
        >
            <AppSidebar />
        </ResizablePanel>

        <ResizableHandle
            with-handle
            @dragging="handleSidebarDragging"
            @keydown.capture="handleResizeKeydown"
        />

        <ResizablePanel
            class="min-h-0 min-w-0 overflow-hidden"
            :min-size="20"
            :style="layout[1] === undefined ? undefined : { flexGrow: layout[1] }"
        >
            <AppContent />
        </ResizablePanel>
    </ResizablePanelGroup>
</template>
