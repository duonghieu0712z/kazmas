import type { TiptapControlProps } from '@/components/tiptap/editor';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as InvisibleCharactersButton } from './InvisibleCharactersButton.vue';
export * from './use-invisible-characters';

export interface InvisibleCharactersButtonProps
    extends Omit<ToggleProps, 'size'>, TiptapControlProps {
    showLabel?: boolean;
    showTooltip?: boolean;
}
