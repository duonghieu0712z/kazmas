import { expect, test } from './fixtures';

const mac = process.platform === 'darwin';

test('dragging tabs preserves the active editor and persists their new order', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await page.getByRole('treeitem', { name: /A very long chapter title/ }).click();
    const tabs = page.getByRole('tab');
    await tabs.nth(1).click();
    await page.locator('.tiptap:visible').fill('Draft retained during tab reorder');
    const titles = await tabs.allTextContents();
    const first = (await tabs.nth(0).boundingBox())!;
    const last = (await tabs.nth(2).boundingBox())!;
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(last.x + last.width - 2, last.y + 120, { steps: 10 });
    const preview = page.locator('[data-slot="tab-drag-preview"]');
    await expect(preview).toHaveText(titles[0]!);
    expect((await preview.boundingBox())!.y).toBeGreaterThan(last.y + last.height);
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.mouse.up();
    await expect(preview).toHaveCount(0);
    await expect(tabs).toHaveText([titles[1]!, titles[2]!, titles[0]!]);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.tiptap:visible')).toHaveText('Draft retained during tab reorder');

    const source = (await tabs.nth(2).boundingBox())!;
    const destination = (await tabs.nth(0).boundingBox())!;
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(destination.x + 2, destination.y + 140, { steps: 10 });
    await expect(preview).toHaveText(titles[0]!);
    await page.keyboard.press('Escape');
    await expect(preview).toHaveCount(0);
    await page.mouse.up();
    await expect(tabs).toHaveText([titles[1]!, titles[2]!, titles[0]!]);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await page.reload();
    await expect(tabs).toHaveText([titles[1]!, titles[2]!, titles[0]!]);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
});

test('dragging near the tab strip edge scrolls to hidden tabs', async ({ page, workspace }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await workspace.open();
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await page.getByRole('treeitem', { name: /A very long chapter title/ }).click();
    const tabs = page.getByRole('tab');
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    const titles = await tabs.allTextContents();
    const viewport = page
        .locator('[data-slot="scroll-area-viewport"]')
        .filter({ has: page.getByRole('tablist') });
    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBe(0);
    const source = (await tabs.nth(0).boundingBox())!;
    const bounds = (await viewport.boundingBox())!;
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width - 4, source.y + 80, { steps: 10 });
    const outsidePositions = await viewport.evaluate(async (element) => {
        const positions: number[] = [];
        for (let index = 0; index < 10; index++) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            positions.push(element.scrollLeft);
        }
        return positions;
    });
    expect(outsidePositions.every((position) => position === 0)).toBe(true);
    await page.mouse.move(bounds.x + bounds.width - 4, source.y + source.height / 2);
    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect
        .poll(() =>
            viewport.evaluate(
                (element) => element.scrollWidth - element.clientWidth - element.scrollLeft,
            ),
        )
        .toBeLessThanOrEqual(1);
    await page.mouse.up();
    await expect(tabs).toHaveText([titles[1]!, titles[2]!, titles[0]!]);
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
});

test('webview reload restores open tabs and the active document', async ({ page, workspace }) => {
    await workspace.open();
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveText(['Chapter A', 'Chapter B']);
    await page.reload();
    await expect(tabs).toHaveText(['Chapter A', 'Chapter B']);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.tiptap:visible')).toContainText('A sample manuscript');
    await page.getByRole('button', { name: 'Close Chapter A', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
    await page.reload();
    await expect(tabs).toHaveText(['Chapter B']);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
});

test('tree selection opens the correct document and updates breadcrumbs', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
    await expect(page.locator('main').locator('..').getByRole('navigation')).toContainText(
        'Chapter B',
    );
});

test('keyboard navigation opens a document from the tree', async ({ page, workspace }) => {
    await workspace.open();
    const first = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    await first.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
});

test('toolbar bold changes the document and reflects its active state', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    await page.locator('.tiptap:visible').click();
    await page.locator('.tiptap:visible').press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(page.locator('.tiptap:visible strong')).toContainText('A sample manuscript');
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
    );
});

test('switching documents immediately preserves the pending edit', async ({ page, workspace }) => {
    await workspace.open();
    await page.locator('.tiptap:visible').fill('Saved before switching');
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Saved before switching');
});

test('document read errors are visible without mounting an empty editor', async ({
    page,
    workspace,
}) => {
    await workspace.open('load-error');
    await expect(page.getByRole('alert')).toHaveText('Document could not be loaded.');
    await expect(page.locator('.tiptap:visible')).toHaveCount(0);
});

test('failed document writes remain available for retry', async ({ page, workspace }) => {
    await workspace.open('save-error');
    await expect(page.locator('.tiptap:visible')).toBeVisible();
    await page.locator('.tiptap:visible').fill('Retained after write failure');
    await expect(page.getByRole('alert')).toHaveText('Document could not be saved.');
    await expect
        .poll(() => page.evaluate(() => window.__kazmasTest.documents.get('entry-a')))
        .not.toContain('Retained after write failure');
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Retained after write failure');
});

test('a delayed document response does not replace the current editor', async ({
    page,
    workspace,
}) => {
    await workspace.open('slow-document');
    await page.waitForFunction(() =>
        window.__kazmasTest.calls.some(
            (call) => call.command === 'get_document' && call.args.nodeId === 'entry-a',
        ),
    );
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
    await page.evaluate(() => window.__kazmasTest.releaseDocument('entry-a'));
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
});

test('code block language selection persists with the document', async ({ page, workspace }) => {
    await workspace.open();
    await page.locator('.tiptap:visible').click();
    await page.locator('.tiptap:visible').press('ControlOrMeta+a');
    await page.locator('.tiptap:visible').press('ControlOrMeta+Alt+c');
    const codeBlock = page
        .locator('.tiptap:visible [data-node-view-wrapper]')
        .filter({ hasText: 'A sample manuscript' });
    await codeBlock.getByRole('button', { name: 'Code block language', exact: true }).click();
    await page.getByPlaceholder('Search languages').fill('javascript');
    await page.getByRole('option', { name: /JavaScript/ }).click();
    await expect(codeBlock.locator('pre')).toHaveAttribute('data-language', 'javascript');
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('Second chapter content.');
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await expect(codeBlock.locator('pre')).toHaveAttribute('data-language', 'javascript');
    await expect(codeBlock.locator('pre')).toContainText('A sample manuscript');
});

test('new world dialog validates input and restores focus after cancellation', async ({
    page,
    workspace,
}) => {
    await workspace.open('empty');
    const focusTarget = mac
        ? page.getByRole('button', { name: 'Manuscript', exact: true })
        : page.getByRole('menuitem', { name: 'File', exact: true });
    await expect(focusTarget).toBeVisible();
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

test('sidebar can be resized with the keyboard and collapsed', async ({ page, workspace }) => {
    await workspace.open();
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
    workspace,
}) => {
    await page.setViewportSize({ width: 640, height: 480 });
    await workspace.open();
    await expect(page.locator('.tiptap:visible')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
    );
});

test('long document content scrolls inside the editor viewport', async ({ page, workspace }) => {
    await workspace.open();
    await page
        .locator('.tiptap:visible')
        .fill(Array.from({ length: 100 }, (_, index) => `Paragraph ${index}`).join('\n'));
    const viewport = page.locator('main [data-reka-scroll-area-viewport]').last();
    await expect
        .poll(() => viewport.evaluate((element) => element.scrollHeight > element.clientHeight))
        .toBe(true);
});

test('find and replace updates matching text in the document', async ({ page, workspace }) => {
    await workspace.open();
    await page.getByRole('button', { name: 'Find and replace', exact: true }).click();
    await page.getByPlaceholder('Find', { exact: true }).fill('sample');
    await page.getByRole('button', { name: 'Toggle replace', exact: true }).click();
    await page.getByPlaceholder('Replace', { exact: true }).fill('revised');
    await page.getByRole('button', { name: 'Replace all matches', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toContainText('A revised manuscript');
});

test('reset formatting removes selected bold marks', async ({ page, workspace }) => {
    await workspace.open();
    await page.locator('.tiptap:visible').click();
    await page.locator('.tiptap:visible').press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(page.locator('.tiptap:visible strong')).toBeVisible();
    await page.getByRole('button', { name: /Reset.*formatting/i }).click();
    await expect(page.locator('.tiptap:visible strong')).toHaveCount(0);
    await expect(page.locator('.tiptap:visible')).toContainText('A sample manuscript');
});

test('clicking below the last block adds one trailing paragraph', async ({ page, workspace }) => {
    await workspace.open();
    const editor = page.locator('.tiptap:visible');
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
        test(`visual ${scenario} ${theme}`, async ({ page, workspace }) => {
            await page.addInitScript(
                (value) => localStorage.setItem('vueuse-color-scheme', value),
                theme,
            );
            await workspace.open(scenario);
            if (scenario === 'editor' || scenario === 'long') {
                await expect(page.locator('.tiptap:visible')).toBeVisible();
            } else if (scenario === 'dialog') {
                await expect(page.getByRole('dialog')).toBeVisible();
            } else {
                await expect(
                    page.getByRole('button', { name: 'Manuscript', exact: true }),
                ).toBeVisible();
            }
            await page.evaluate(() => document.fonts.ready);
            await page.mouse.move(1190, 790);
            await expect(page).toHaveScreenshot(`${scenario}-${theme}.png`);
        });
    }
}
