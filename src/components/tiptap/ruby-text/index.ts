import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as RubyTextPopover } from './RubyTextPopover.vue';
export * from './use-ruby-text';

export interface RubyTextPopoverProps
    extends Omit<ToggleProps, 'modelValue' | 'size'>, TiptapControlProps {
    showTooltip?: boolean;
}
