<script setup lang="ts">
import type { SidebarProps } from '.';

import { computed } from 'vue';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import { sidebarContainerVariants, sidebarGapVariants } from '.';
import { provideSidebarLayoutContext, SIDEBAR_WIDTH_MOBILE, useSidebar } from './utils';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(defineProps<SidebarProps>(), {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
});

const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

const hasDesktopLayout = computed(() => !isMobile.value && props.collapsible !== 'none');

provideSidebarLayoutContext({
    side: computed(() => (hasDesktopLayout.value ? props.side : null)),
    collapsible: computed(() =>
        hasDesktopLayout.value && state.value === 'collapsed' ? props.collapsible : null,
    ),
});
</script>

<template>
    <div
        v-if="collapsible === 'none'"
        :class="
            cn(
                'flex h-full w-(--sidebar-width) flex-col bg-background text-foreground',
                props.class,
            )
        "
        data-slot="sidebar"
        v-bind="$attrs"
    >
        <slot />
    </div>

    <Sheet v-else-if="isMobile" :open="openMobile" v-bind="$attrs" @update:open="setOpenMobile">
        <SheetContent
            class="w-(--sidebar-width) bg-background p-0 text-foreground [&>button]:hidden"
            data-mobile="true"
            data-sidebar="sidebar"
            data-slot="sidebar"
            :side="side"
            :style="{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE }"
        >
            <SheetHeader class="sr-only">
                <SheetTitle>Sidebar</SheetTitle>
                <SheetDescription>Displays the mobile sidebar.</SheetDescription>
            </SheetHeader>
            <div class="flex h-full w-full flex-col">
                <slot />
            </div>
        </SheetContent>
    </Sheet>

    <div
        v-else
        class="group peer hidden text-foreground md:block"
        :data-collapsible="state === 'collapsed' ? collapsible : ''"
        :data-side="side"
        data-slot="sidebar"
        :data-state="state"
        :data-variant="variant"
    >
        <div :class="cn(sidebarGapVariants({ side, variant, collapsible, state }))" />
        <div
            :class="
                cn(sidebarContainerVariants({ side, variant, collapsible, state }), props.class)
            "
            v-bind="$attrs"
        >
            <div
                :class="[
                    'flex h-full w-full flex-col bg-background',
                    'group-data-[variant=floating]:rounded-sm group-data-[variant=floating]:border group-data-[variant=floating]:border-border group-data-[variant=floating]:shadow-xs',
                ]"
                data-sidebar="sidebar"
            >
                <slot />
            </div>
        </div>
    </div>
</template>
