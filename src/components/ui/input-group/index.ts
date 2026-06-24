import type { ButtonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'vue';

import { cva } from 'class-variance-authority';

export { default as InputGroup } from './InputGroup.vue';
export { default as InputGroupAddon } from './InputGroupAddon.vue';
export { default as InputGroupButton } from './InputGroupButton.vue';
export { default as InputGroupInput } from './InputGroupInput.vue';
export { default as InputGroupText } from './InputGroupText.vue';
export { default as InputGroupTextarea } from './InputGroupTextarea.vue';

export const inputGroupAddonVariants = cva(
    [
        'text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none',
        "group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
    ],
    {
        variants: {
            align: {
                'inline-start': 'order-first pl-2 has-[>button]:-ml-1 has-[>kbd]:ml-[-0.15rem]',
                'inline-end': 'order-last pr-2 has-[>button]:-mr-1 has-[>kbd]:mr-[-0.15rem]',
                'block-start':
                    'order-first w-full justify-start px-2 pt-1 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3',
                'block-end':
                    'order-last w-full justify-start px-2 pb-1 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3',
            },
        },
        defaultVariants: {
            align: 'inline-start',
        },
    },
);

export type InputGroupVariants = VariantProps<typeof inputGroupAddonVariants>;

export const inputGroupButtonVariants = cva('shadow-none', {
    variants: {
        size: {
            default: 'h-6 gap-2 px-2',
            icon: 'size-6',
        },
    },
    defaultVariants: {
        size: 'default',
    },
});

export type InputGroupButtonVariants = VariantProps<typeof inputGroupButtonVariants>;

export interface InputGroupButtonProps {
    variant?: ButtonVariants['variant'];
    size?: InputGroupButtonVariants['size'];
    class?: HTMLAttributes['class'];
}
