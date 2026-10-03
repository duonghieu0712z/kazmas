import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

const mac = process.platform === 'darwin';

async function expectPlatformChrome(page: Page) {
    const fileMenu = page.getByRole('menuitem', { name: 'File', exact: true });
    const closeWindow = page.getByRole('button', { name: 'Close window', exact: true });
    if (mac) {
        await expect(fileMenu).toHaveCount(0);
        await expect(closeWindow).toHaveCount(0);
    } else {
        await expect(fileMenu).toBeVisible();
        await expect(closeWindow).toBeVisible();
    }
}

async function openEditor(page: Page) {
    await page.goto('/?scenario=editor');
    await expect(page.locator('.tiptap')).toContainText('A sample manuscript');
    await expectPlatformChrome(page);
    await page.evaluate(() => document.fonts.ready);
}

test('tree selection opens the correct document and updates breadcrumbs', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await expect(page.locator('.tiptap')).toContainText('Second chapter content.');
    await expect(page.locator('main').locator('..').getByRole('navigation')).toContainText(
        'Chapter B',
    );
});

test('keyboard navigation opens a document from the tree', async ({ page }) => {
    await openEditor(page);
    const first = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    await first.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('.tiptap')).toContainText('Second chapter content.');
});

test('toolbar bold changes the document and reflects its active state', async ({ page }) => {
    await openEditor(page);
    await page.locator('.tiptap').click();
    await page.locator('.tiptap').press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(page.locator('.tiptap strong')).toContainText('A sample manuscript');
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
    );
});

test('switching documents immediately preserves the pending edit', async ({ page }) => {
    await openEditor(page);
    await page.locator('.tiptap').fill('Saved before switching');
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await expect(page.locator('.tiptap')).toContainText('Second chapter content.');
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await expect(page.locator('.tiptap')).toContainText('Saved before switching');
});

test('new world dialog validates input and restores focus after cancellation', async ({ page }) => {
    await page.goto('/?scenario=empty');
    const focusTarget = mac
        ? page.getByRole('button', { name: 'Manuscript', exact: true })
        : page.getByRole('menuitem', { name: 'File', exact: true });
    await expect(focusTarget).toBeVisible();
    await expectPlatformChrome(page);
    if (mac) {
        await focusTarget.focus();
        await page.waitForFunction(() => Boolean(window.__kazmasTest));
        await page.evaluate(() => window.__kazmasTest.menuCommand('new-world'));
    } else {
        await focusTarget.click();
        await page.getByRole('menuitem', { name: /New World/ }).click();
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Browse', exact: true }).click();
    await page.getByLabel('World Name').fill('   ');
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();
    await page.getByLabel('World Name').fill('Valid World');
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(focusTarget).toBeFocused();
});

test('sidebar can be resized with the keyboard and collapsed', async ({ page }) => {
    await openEditor(page);
    const handle = page.locator('[data-slot="resizable-handle"]');
    await handle.focus();
    const before = await handle.boundingBox();
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await handle.boundingBox())?.x).not.toBe(before?.x);
    await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
    await expect(page.getByRole('tree')).toBeHidden();
    await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
    await expect(page.getByRole('tree')).toBeVisible();
});

test('small workspace keeps controls accessible without document-level overflow', async ({
    page,
}) => {
    await page.setViewportSize({ width: 640, height: 480 });
    await openEditor(page);
    await expectPlatformChrome(page);
    await expect(page.locator('.tiptap')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
    );
});

test('long document content scrolls inside the editor viewport', async ({ page }) => {
    await openEditor(page);
    await page
        .locator('.tiptap')
        .fill(Array.from({ length: 100 }, (_, index) => `Paragraph ${index}`).join('\n'));
    const viewport = page.locator('main [data-reka-scroll-area-viewport]').last();
    await expect
        .poll(() => viewport.evaluate((element) => element.scrollHeight > element.clientHeight))
        .toBe(true);
});

test('find and replace updates matching text in the document', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Find and replace', exact: true }).click();
    await page.getByPlaceholder('Find', { exact: true }).fill('sample');
    await page.getByRole('button', { name: 'Toggle replace', exact: true }).click();
    await page.getByPlaceholder('Replace', { exact: true }).fill('revised');
    await page.getByRole('button', { name: 'Replace all matches', exact: true }).click();
    await expect(page.locator('.tiptap')).toContainText('A revised manuscript');
});

test('reset formatting removes selected bold marks', async ({ page }) => {
    await openEditor(page);
    await page.locator('.tiptap').click();
    await page.locator('.tiptap').press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(page.locator('.tiptap strong')).toBeVisible();
    await page.getByRole('button', { name: /Reset.*formatting/i }).click();
    await expect(page.locator('.tiptap strong')).toHaveCount(0);
    await expect(page.locator('.tiptap')).toContainText('A sample manuscript');
});

test('clicking below the last block adds one trailing paragraph', async ({ page }) => {
    await openEditor(page);
    const editor = page.locator('.tiptap');
    const initial = await editor.locator('p').count();
    const box = await editor.boundingBox();
    const last = await editor.locator('p').last().boundingBox();
    if (!box || !last) {
        throw new Error('Editor layout is unavailable.');
    }
    await page.mouse.click(box.x + 50, last.y + last.height + 20);
    await expect(editor.locator('p')).toHaveCount(initial + 1);
    const empty = await editor.locator('p').last().boundingBox();
    if (!empty) {
        throw new Error('Trailing paragraph layout is unavailable.');
    }
    await page.mouse.click(box.x + 50, empty.y + empty.height + 20);
    await expect(editor.locator('p')).toHaveCount(initial + 1);
});

for (const scenario of ['empty', 'editor', 'long', 'dialog']) {
    for (const theme of ['light', 'dark'] as const) {
        test(`visual ${scenario} ${theme}`, async ({ page }) => {
            await page.addInitScript(
                (value) => localStorage.setItem('vueuse-color-scheme', value),
                theme,
            );
            await page.goto(`/?scenario=${scenario}`);
            if (scenario === 'editor' || scenario === 'long') {
                await expect(page.locator('.tiptap')).toBeVisible();
            } else if (scenario === 'dialog') {
                await expect(page.getByRole('dialog')).toBeVisible();
            } else {
                await expect(
                    page.getByRole('button', { name: 'Manuscript', exact: true }),
                ).toBeVisible();
            }
            await expectPlatformChrome(page);
            await page.evaluate(() => document.fonts.ready);
            await page.mouse.move(1190, 790);
            await expect(page).toHaveScreenshot(`${scenario}-${theme}.png`);
        });
    }
}
