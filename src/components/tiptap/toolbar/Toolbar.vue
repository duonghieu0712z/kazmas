<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { ChevronsLeftIcon, ChevronsRightIcon } from '@lucide/vue';
import { useResizeObserver } from '@vueuse/core';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<{
        class?: HTMLAttributes['class'];
        overflow?: 'navigation' | 'scroll';
    }>(),
    {
        overflow: 'scroll',
    },
);

const navigationViewport = useTemplateRef<HTMLElement>('navigationViewport');
const navigationContent = useTemplateRef<HTMLElement>('navigationContent');
const canGoBackward = ref(false);
const canGoForward = ref(false);
const navigationEndSpace = ref(0);
const previousNavigationPositions: number[] = [];

function getGroups() {
    return Array.from(
        navigationContent.value?.querySelectorAll<HTMLElement>(
            ':scope > [data-slot="button-group"] > [data-slot="button-group"]',
        ) ?? [],
    );
}

function getGroupItems(group: HTMLElement) {
    return Array.from(group.children, (element) => element as HTMLElement);
}

function getNextNavigationTarget(viewportRect: DOMRect) {
    for (const group of getGroups()) {
        const groupRect = group.getBoundingClientRect();

        if (groupRect.width > viewportRect.width + 1) {
            const item = getGroupItems(group).find(
                (item) => item.getBoundingClientRect().right > viewportRect.right + 1,
            );

            if (item) {
                return item;
            }
        }

        if (groupRect.right > viewportRect.right + 1) {
            return group;
        }
    }
}

function updateGroupVisibility() {
    const viewport = navigationViewport.value;
    const content = navigationContent.value;

    if (!viewport || !content) {
        return;
    }

    navigationEndSpace.value = viewport.clientWidth;

    const viewportRect = viewport.getBoundingClientRect();
    const visibleGroups = new Set<HTMLElement>();

    for (const group of getGroups()) {
        const groupRect = group.getBoundingClientRect();
        const items = getGroupItems(group);
        const isOversized = groupRect.width > viewportRect.width + 1;

        if (isOversized) {
            group.style.visibility = '';

            for (const item of items) {
                const itemRect = item.getBoundingClientRect();
                const isFullyVisible =
                    itemRect.left >= viewportRect.left - 1 &&
                    itemRect.right <= viewportRect.right + 1;

                item.style.visibility = isFullyVisible ? '' : 'hidden';

                if (isFullyVisible) {
                    visibleGroups.add(group);
                }
            }

            continue;
        }

        for (const item of items) {
            item.style.visibility = '';
        }

        const isFullyVisible =
            groupRect.left >= viewportRect.left - 1 && groupRect.right <= viewportRect.right + 1;

        group.style.visibility = isFullyVisible ? '' : 'hidden';

        if (isFullyVisible) {
            visibleGroups.add(group);
        }
    }

    const separators = content.querySelectorAll<HTMLElement>(
        ':scope > [data-slot="button-group"] > [data-slot="button-group-separator"]',
    );

    for (const separator of separators) {
        const previous = separator.previousElementSibling as HTMLElement | null;
        const next = separator.nextElementSibling as HTMLElement | null;
        const separatorRect = separator.getBoundingClientRect();
        const isFullyVisible =
            separatorRect.left >= viewportRect.left - 1 &&
            separatorRect.right <= viewportRect.right + 1;
        const isVisible =
            isFullyVisible &&
            previous &&
            next &&
            visibleGroups.has(previous) &&
            visibleGroups.has(next);

        separator.style.visibility = isVisible ? '' : 'hidden';
    }
}

function updateNavigation() {
    const viewport = navigationViewport.value;

    if (!viewport) {
        canGoBackward.value = false;
        canGoForward.value = false;
        return;
    }

    const viewportRect = viewport.getBoundingClientRect();

    if (viewport.scrollLeft <= 1) {
        previousNavigationPositions.length = 0;
    }

    canGoBackward.value = previousNavigationPositions.length > 0;
    canGoForward.value = Boolean(getNextNavigationTarget(viewportRect));
    updateGroupVisibility();
}

function goToPreviousGroup() {
    const viewport = navigationViewport.value;

    if (!viewport) {
        return;
    }

    const targetLeft = previousNavigationPositions.pop() ?? 0;

    viewport.scrollTo({ left: targetLeft });
    updateNavigation();
}

function goToNextGroup() {
    const viewport = navigationViewport.value;

    if (!viewport) {
        return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const target = getNextNavigationTarget(viewportRect);
    const targetRect = target?.getBoundingClientRect();

    if (!targetRect) {
        return;
    }

    previousNavigationPositions.push(viewport.scrollLeft);
    viewport.scrollTo({ left: viewport.scrollLeft + targetRect.left - viewportRect.left });
    updateNavigation();
}

useResizeObserver(navigationViewport, updateNavigation);
useResizeObserver(navigationContent, updateNavigation);
</script>

<template>
    <ScrollArea
        v-if="overflow === 'scroll'"
        :class="cn('relative z-40 w-full shrink-0 bg-background', props.class)"
        data-slot="toolbar"
        horizontal
    >
        <ButtonGroup
            :class="[
                'min-h-9 w-max min-w-full flex-nowrap items-center justify-start border-b px-2 py-1',
                'has-[>[data-slot=button-group]]:shrink-0 has-[>[data-slot=button-group]]:gap-0.5',
            ]"
            spacing="spaced"
        >
            <slot />
        </ButtonGroup>
    </ScrollArea>

    <div
        v-else
        :class="cn('relative z-40 flex w-full shrink-0 border-b bg-background', props.class)"
        data-slot="toolbar"
    >
        <Button
            v-if="canGoBackward"
            aria-label="Previous toolbar controls"
            class="my-1 ml-2"
            size="icon"
            type="button"
            variant="ghost"
            @click="goToPreviousGroup"
        >
            <ChevronsLeftIcon />
        </Button>

        <div
            ref="navigationViewport"
            class="min-w-0 flex-1 overflow-hidden"
            @scroll="updateNavigation"
        >
            <div ref="navigationContent" class="w-max min-w-full">
                <ButtonGroup
                    :class="[
                        'min-h-9 w-full min-w-max flex-nowrap items-center justify-start px-2 py-1',
                        'has-[>[data-slot=button-group]]:shrink-0 has-[>[data-slot=button-group]]:gap-0.5',
                    ]"
                    spacing="spaced"
                >
                    <slot />
                    <div
                        aria-hidden="true"
                        class="h-px shrink-0"
                        :style="{ width: `${navigationEndSpace}px` }"
                    />
                </ButtonGroup>
            </div>
        </div>

        <Button
            v-if="canGoForward"
            aria-label="Next toolbar controls"
            class="my-1 mr-2"
            size="icon"
            type="button"
            variant="ghost"
            @click="goToNextGroup"
        >
            <ChevronsRightIcon />
        </Button>
    </div>
</template>
