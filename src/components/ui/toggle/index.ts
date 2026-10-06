import type { VariantProps } from 'class-variance-authority';
import type { ToggleProps as _ToggleProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cva } from 'class-variance-authority';

export { default as Toggle } from './Toggle.vue';

export const toggleVariants = cva(
    [
        'inline-flex items-center justify-center rounded-sm bg-transparent text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none',
        'hover:bg-hover hover:text-hover-foreground',
        'active:bg-active active:text-active-foreground',
        'data-[state=on]:bg-active data-[state=on]:text-active-foreground',
        'focus-visible:border-ring focus-visible:ring-[1.5px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:pointer-events-none disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    ],
    {
        variants: {
            variant: {
                default: null,
                outline: 'border border-border shadow-xs',
            },
            size: {
                default: 'h-8 gap-2 px-2',
                icon: 'size-8',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export type ToggleVariants = VariantProps<typeof toggleVariants>;

export interface ToggleProps extends _ToggleProps {
    variant?: ToggleVariants['variant'];
    size?: ToggleVariants['size'];
    class?: HTMLAttributes['class'];
}
