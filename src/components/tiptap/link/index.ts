import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as LinkPopover } from './LinkPopover.vue';
export * from './use-link';

export interface LinkPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    showTooltip?: boolean;
}
