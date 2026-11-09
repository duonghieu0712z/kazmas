import { appendFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '@wdio/globals';

import '@wdio/tauri-service';

const root = resolve('.artifacts/desktop');
mkdirSync(root, { recursive: true });
const runDirectory = process.env.KAZMAS_TEST_DATA_DIR ?? mkdtempSync(resolve(root, 'run-'));
process.env.KAZMAS_TEST_DATA_DIR = runDirectory;

function traceDesktopCommand(event: string, name: string) {
    appendFileSync(
        resolve(runDirectory, `commands-${process.pid}.log`),
        `${new Date().toISOString()} ${event} ${name}\n`,
    );
}

export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./tests/desktop/**/*.spec.ts'],
    maxInstances: 1,
    capabilities: [
        {
            browserName: 'wry',
            'wdio:tauriServiceOptions': {
                appBinaryPath: resolve(
                    `.artifacts/desktop/bin/kazmas${process.platform === 'win32' ? '.exe' : ''}`,
                ),
                driverProvider: 'embedded',
            },
        },
    ],
    services: [
        [
            'tauri',
            {
                driverProvider: 'embedded',
                appBinaryPath: resolve(
                    `.artifacts/desktop/bin/kazmas${process.platform === 'win32' ? '.exe' : ''}`,
                ),
                captureBackendLogs: true,
                captureFrontendLogs: true,
                logDir: resolve(runDirectory, 'logs'),
                env: {
                    KAZMAS_TEST_TEMP_DIR: resolve(runDirectory, 'workspaces'),
                    KAZMAS_TEST_DATA_DIR: runDirectory,
                },
            },
        ],
    ],
    framework: 'mocha',
    reporters: ['spec'],
    logLevel: 'warn',
    outputDir: resolve(runDirectory, 'logs'),
    waitforTimeout: 15000,
    connectionRetryTimeout: 60000,
    connectionRetryCount: 1,
    mochaOpts: { timeout: 60000 },
    beforeTest(test) {
        traceDesktopCommand('TEST', test.title);
    },
    beforeCommand(commandName) {
        traceDesktopCommand('START', commandName);
    },
    afterCommand(commandName, _args, _result, error) {
        traceDesktopCommand(error ? 'FAIL' : 'END', commandName);
    },
    async afterTest(_test, _context, result) {
        if (!result.passed) {
            await browser.saveScreenshot(resolve(runDirectory, `failure-${Date.now()}.png`));
        }
    },
};
