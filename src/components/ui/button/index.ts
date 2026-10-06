import type { VariantProps } from 'class-variance-authority';
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cva } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
    [
        'inline-flex shrink-0 items-center justify-center rounded-sm text-sm font-medium whitespace-nowrap transition-all outline-none',
        'hover:bg-hover hover:text-hover-foreground',
        'active:bg-active active:text-active-foreground',
        'focus-visible:border-focus-ring focus-visible:ring-[1.5px] focus-visible:ring-focus-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:pointer-events-none disabled:text-disabled-foreground! disabled:[&_svg]:text-disabled-foreground!',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    ],
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/80 active:text-primary-foreground',
                secondary: 'border bg-secondary text-secondary-foreground',
                destructive:
                    'bg-destructive text-primary-foreground hover:bg-destructive/90 hover:text-primary-foreground focus-visible:ring-destructive/20 active:bg-destructive/80 active:text-primary-foreground',
                outline: 'border bg-background shadow-xs',
                ghost: null,
                link: 'text-foreground underline-offset-4 hover:bg-transparent hover:underline active:bg-transparent',
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
