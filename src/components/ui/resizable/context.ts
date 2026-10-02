import type { ComputedRef } from 'vue';

import { createContext } from 'reka-ui';

export type ResizableAppearance = 'boxed' | 'split';
export type ResizableOrientation = 'horizontal' | 'vertical';

export const [injectResizableContext, provideResizableContext] = createContext<{
    appearance: ComputedRef<ResizableAppearance>;
    orientation: ComputedRef<ResizableOrientation>;
}>('Resizable');
