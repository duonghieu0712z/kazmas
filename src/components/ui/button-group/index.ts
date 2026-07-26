import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';

export { default as ButtonGroup } from './ButtonGroup.vue';
export { default as ButtonGroupSeparator } from './ButtonGroupSeparator.vue';
export { default as ButtonGroupText } from './ButtonGroupText.vue';

export const buttonGroupVariants = cva(
    [
        'flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10',
        "has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-sm [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
    ],
    {
        variants: {
            orientation: {
                horizontal: 'flex-row',
                vertical: 'flex-col',
            },
            spacing: {
                spaced: 'gap-0.5',
                compact: [
                    'data-[orientation=horizontal]:[&>*:not(:first-child)]:rounded-l-none data-[orientation=horizontal]:[&>*:not(:first-child)]:border-l-0 data-[orientation=horizontal]:[&>*:not(:last-child)]:rounded-r-none',
                    'data-[orientation=vertical]:[&>*:not(:first-child)]:rounded-t-none data-[orientation=vertical]:[&>*:not(:first-child)]:border-t-0 data-[orientation=vertical]:[&>*:not(:last-child)]:rounded-b-none',
                ],
            },
        },
        defaultVariants: {
            orientation: 'horizontal',
            spacing: 'compact',
        },
    },
);

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;
