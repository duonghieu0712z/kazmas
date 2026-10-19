import type { Page } from '@playwright/test';

import { expect, test as base } from '@playwright/test';

import { getToolbarNavigationState } from '../support/toolbar';

type Workspace = {
    open: (scenario?: string) => Promise<void>;
};

export async function showToolbarControl(page: Page, name: string) {
    const control = page.getByRole('button', { name, exact: true, includeHidden: true });
    let state = await page.evaluate(getToolbarNavigationState, name);
    const maxSteps = state.controlCount * 2;

    for (let index = 0; index < maxSteps; index++) {
        if (state.direction === null) {
            await expect(control).toBeVisible();
            return control;
        }

        const navigation = page.getByRole('button', {
            name: `${state.direction} toolbar controls`,
            exact: true,
        });
        const previousLeft = state.scrollLeft;

        await navigation.click();
        await expect
            .poll(async () => {
                state = await page.evaluate(getToolbarNavigationState, name);
                return state.scrollLeft !== previousLeft || state.direction === null;
            })
            .toBe(true);
    }

    throw new Error(`Toolbar control ${name} could not be reached.`);
}

async function expectPlatformChrome(page: Page) {
    const fileMenu = page.getByRole('menuitem', { name: 'File', exact: true, includeHidden: true });
    const closeWindow = page.getByRole('button', {
        name: 'Close window',
        exact: true,
        includeHidden: true,
    });
    if (process.platform === 'darwin') {
        await expect(fileMenu).toHaveCount(0);
        await expect(closeWindow).toHaveCount(0);
    } else {
        await expect(fileMenu).toBeVisible();
        await expect(closeWindow).toBeVisible();
    }
}

export const test = base.extend<{ workspace: Workspace; pageErrors: string[] }>({
    pageErrors: [
        async ({ page }, use, testInfo) => {
            const errors: string[] = [];
            const resizeNotifications: string[] = [];
            const recordError = (error: Error) => {
                if (
                    error.message ===
                    'ResizeObserver loop completed with undelivered notifications.'
                ) {
                    resizeNotifications.push(error.message);
                } else {
                    errors.push(error.stack ?? error.message);
                }
            };
            page.on('pageerror', recordError);
            try {
                await use(errors);
            } finally {
                page.off('pageerror', recordError);
                if (errors.length || resizeNotifications.length) {
                    await testInfo.attach('browser-errors', {
                        body: JSON.stringify({ errors, resizeNotifications }, null, 2),
                        contentType: 'application/json',
                    });
                }
                expect(errors, 'Unexpected browser JavaScript errors').toEqual([]);
            }
        },
        { auto: true },
    ],
    workspace: async ({ page }, use) => {
        await use({
            open: async (scenario = 'editor') => {
                await page.goto(`?scenario=${scenario}`);
                await page.waitForFunction(() => Boolean(window.__kazmasTest));
                await expectPlatformChrome(page);
                await page.evaluate(() => document.fonts.ready);
                if (scenario === 'editor') {
                    await expect(page.locator('.tiptap:visible')).toContainText(
                        'A sample manuscript',
                    );
                }
            },
        });
    },
});

export { expect };
