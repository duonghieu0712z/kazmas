import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';

export type { ResizableSeparation, ResizableOrientation } from './context';
export { default as ResizableHandle } from './ResizableHandle.vue';
export { default as ResizablePanel } from './ResizablePanel.vue';
export { default as ResizablePanelGroup } from './ResizablePanelGroup.vue';

export const resizableHandleVariants = cva(
    [
        'relative flex shrink-0 items-center justify-center border-ring',
        'focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:outline-hidden',
    ],
    {
        variants: {
            separation: {
                gap: null,
                divider: 'before:absolute before:bg-border',
            },
            orientation: {
                horizontal:
                    'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
                vertical: [
                    'w-full',
                    'after:absolute after:inset-y-0 after:left-0 after:h-1 after:w-full after:-translate-y-1/2',
                    '[&>div]:rotate-90',
                ],
            },
        },
        compoundVariants: [
            {
                separation: 'gap',
                orientation: 'horizontal',
                class: 'w-1',
            },
            {
                separation: 'gap',
                orientation: 'vertical',
                class: 'h-1',
            },
            {
                separation: 'divider',
                orientation: 'horizontal',
                class: 'w-px before:inset-y-0 before:left-0 before:w-px before:-translate-x-1/2',
            },
            {
                separation: 'divider',
                orientation: 'vertical',
                class: 'h-px before:inset-x-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2',
            },
        ],
        defaultVariants: {
            separation: 'gap',
            orientation: 'horizontal',
        },
    },
);

export type ResizableHandleVariants = VariantProps<typeof resizableHandleVariants>;
