import type { UseParagraphConfig } from './useParagraph';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as ParagraphButton } from './ParagraphButton.vue';
export * from './useParagraph';

export interface ParagraphButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseParagraphConfig, 'onSet'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
