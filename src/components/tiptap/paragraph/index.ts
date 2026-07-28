import type { UseParagraphConfig } from './useParagraph';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as ParagraphToggle } from './ParagraphToggle.vue';
export * from './useParagraph';

export interface ParagraphToggleProps
    extends Omit<ToggleProps, 'size'>, Omit<UseParagraphConfig, 'onSet'> {
    showLabel?: boolean;
    showTooltip?: boolean;
    showShortcut?: boolean;
}
