import type { UiTestBridge } from './harness';

declare global {
    interface Window {
        __kazmasTest: UiTestBridge;
    }
}
