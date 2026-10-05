import { expect, test } from './fixtures';

test('mounts only visible rows and navigates to distant items by keyboard', async ({
    page,
    workspace,
}) => {
    await workspace.open('large-tree');
    const tree = page.getByRole('tree', { name: 'Manuscript' });
    await expect(tree.getByRole('treeitem', { name: 'Chapter 00000', exact: true })).toBeVisible();
    expect(await tree.getByRole('treeitem').count()).toBeLessThan(100);
    await tree.getByRole('treeitem', { name: 'Chapter 00000', exact: true }).focus();
    await page.keyboard.press('End');
    const last = tree.getByRole('treeitem', { name: 'Chapter 19999', exact: true });
    await expect(last).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('main').locator('..').getByRole('navigation')).toContainText(
        'Chapter 19999',
    );
    expect(await tree.getByRole('treeitem').count()).toBeLessThan(100);
    await expect(page.locator('.tiptap')).toBeFocused();
    await last.focus();
    await page.keyboard.press('Home');
    await expect(tree.getByRole('treeitem', { name: 'Chapter 00000', exact: true })).toBeFocused();
});

test('scrolls to a new draft and keeps its name when it leaves the viewport', async ({
    page,
    workspace,
}) => {
    await workspace.open('large-tree');
    const tree = page.getByRole('tree', { name: 'Manuscript' });
    await page.getByRole('button', { name: 'New manuscript entry', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'New item name' });
    await expect(input).toBeFocused();
    await input.fill('Virtual chapter');
    await tree.locator('..').evaluate((element) => {
        element.scrollTop = 0;
    });
    await expect(input).toHaveCount(0);
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls.filter((call) => call.command === 'create_manuscript_entry'),
        ),
    ).toHaveLength(0);
    await tree.locator('..').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    await expect(input).toHaveValue('Virtual chapter');
    await input.focus();
    await input.press('Enter');
    await expect(input).toHaveCount(0);
    await expect(
        tree.getByRole('treeitem', { name: 'Virtual chapter', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(await tree.getByRole('treeitem').count()).toBeLessThan(100);
});

test('commits or cancels on an outside click after a draft is unmounted by scrolling', async ({
    page,
    workspace,
}) => {
    await workspace.open('large-tree');
    const tree = page.getByRole('tree', { name: 'Manuscript' });
    const outside = page.getByRole('textbox', { name: 'Filter manuscript' });
    for (const name of ['', 'Created outside']) {
        await page.getByRole('button', { name: 'New folder', exact: true }).click();
        const input = page.getByRole('textbox', { name: 'New item name' });
        await expect(input).toBeFocused();
        await input.fill(name);
        await tree.locator('..').evaluate((element) => {
            element.scrollTop = 0;
        });
        await expect(input).toHaveCount(0);
        await outside.click();
        await expect(page.getByRole('button', { name: 'New folder', exact: true })).toBeEnabled();
    }
    await expect(
        tree.getByRole('treeitem', { name: 'Created outside', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls.filter((call) => call.command === 'create_folder'),
        ),
    ).toHaveLength(1);
});

test('filters a large tree and restores scrolling when the filter is cleared', async ({
    page,
    workspace,
}) => {
    await workspace.open('large-tree');
    const filter = page.getByRole('textbox', { name: 'Filter manuscript' });
    const tree = page.getByRole('tree', { name: 'Manuscript' });
    await filter.fill('19999');
    await expect(tree.getByRole('treeitem')).toHaveCount(1);
    await expect(tree.getByRole('treeitem')).toHaveText('Chapter 19999');
    await page.getByRole('button', { name: 'Clear filter', exact: true }).click();
    await expect(tree.getByRole('treeitem', { name: 'Chapter 00000', exact: true })).toBeVisible();
    expect(await tree.getByRole('treeitem').count()).toBeLessThan(100);
    await tree.locator('..').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    await expect(tree.getByRole('treeitem', { name: 'Chapter 19999', exact: true })).toBeVisible();
});
