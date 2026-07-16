import type { UseMarkConfig } from './useMark.ts';
import type { ToggleProps } from '@/components/ui/toggle';

export { default as MarkToggle } from './MarkToggle.vue';
export * from './useMark';

export interface MarkToggleProps extends ToggleProps, UseMarkConfig {
    text?: string;
    showShortcut?: boolean;
}
