import type { UseInvisibleCharactersConfig } from './use-invisible-characters';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as InvisibleCharactersButton } from './InvisibleCharactersButton.vue';
export * from './use-invisible-characters';

export interface InvisibleCharactersButtonProps
    extends Omit<ToggleProps, 'size'>, Omit<UseInvisibleCharactersConfig, 'onToggled'> {
    showLabel?: boolean;
    showTooltip?: boolean;
}
