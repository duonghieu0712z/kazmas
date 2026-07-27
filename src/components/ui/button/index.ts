import type { VariantProps } from 'class-variance-authority';
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cva } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
    [
        'inline-flex shrink-0 items-center justify-center rounded-sm text-sm font-medium whitespace-nowrap transition-all outline-none',
        'focus-visible:border-ring focus-visible:ring-[1.5px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        'disabled:pointer-events-none disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    ],
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive:
                    'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/80 dark:focus-visible:ring-destructive/40',
                outline:
                    'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
                link: 'text-primary underline-offset-4 hover:underline',
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

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps extends PrimitiveProps {
    variant?: ButtonVariants['variant'];
    size?: ButtonVariants['size'];
    class?: HTMLAttributes['class'];
}
