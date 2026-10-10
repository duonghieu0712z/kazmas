import type { DesktopTestBridge } from './bridge';
import type {
    describe as mochaDescribe,
    it as mochaIt,
    beforeEach as mochaBeforeEach,
    afterEach as mochaAfterEach,
} from 'mocha';

import '@wdio/globals/types';

declare global {
    const describe: typeof mochaDescribe;
    const it: typeof mochaIt;
    const beforeEach: typeof mochaBeforeEach;
    const afterEach: typeof mochaAfterEach;
    interface Window {
        __kazmasDesktopTest: DesktopTestBridge;
    }
}
