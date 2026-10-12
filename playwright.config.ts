import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/ui',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    timeout: 60000,
    outputDir: '.artifacts/playwright/results',
    snapshotPathTemplate: '{testDir}/snapshots/{platform}/{projectName}/{testFilePath}/{arg}{ext}',
    reporter: [['list'], ['html', { outputFolder: '.artifacts/playwright/report', open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:1421/tests/ui/index.html',
        viewport: { width: 1200, height: 800 },
        locale: 'en-US',
        timezoneId: 'UTC',
        reducedMotion: 'reduce',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    expect: {
        timeout: 15000,
        toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.001 },
    },
    projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
    webServer: {
        command: 'pnpm exec vite --mode test-ui',
        env: { VITE_UI_TEST_PLATFORM: process.platform },
        url: 'http://127.0.0.1:1421/tests/ui/index.html',
        reuseExistingServer: false,
        timeout: 60000,
    },
});
