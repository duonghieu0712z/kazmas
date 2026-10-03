import type { ComputedRef } from 'vue';

import { createContext } from 'reka-ui';

export type ResizableSeparation = 'gap' | 'divider';
export type ResizableOrientation = 'horizontal' | 'vertical';

export const [injectResizableContext, provideResizableContext] = createContext<{
    separation: ComputedRef<ResizableSeparation>;
    orientation: ComputedRef<ResizableOrientation>;
}>('Resizable');
