import type { VariantProps } from 'class-variance-authority';
import type { ToggleProps as _ToggleProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cva } from 'class-variance-authority';

export { default as Toggle } from './Toggle.vue';

export const toggleVariants = cva(
    [
        'inline-flex items-center justify-center rounded-sm text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-hover hover:text-foreground active:bg-active data-[state=on]:bg-active data-[state=on]:text-foreground',
        'focus-visible:border-ring focus-visible:ring-[1.5px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:pointer-events-none disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    ],
    {
        variants: {
            variant: {
                default: 'bg-transparent',
                outline:
                    'border border-border bg-transparent shadow-xs hover:bg-hover hover:text-foreground',
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
