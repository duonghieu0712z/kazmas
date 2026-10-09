import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

function workspaceTab(page: Page, title: string) {
    return page.getByRole('tab').filter({ has: page.getByText(title, { exact: true }) });
}

test('switches directly between tree and tab menus and ignores right clicks inside menus', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const chapter = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    const tab = workspaceTab(page, 'Chapter A');
    await chapter.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Rename', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Reload Window/ })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Rename', exact: true })).toBeVisible();
    await expect(page.getByRole('menu', { name: 'Context menu' })).toHaveCount(1);
    await tab.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Close Tab', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Rename', exact: true })).toHaveCount(0);
    await chapter.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Rename', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Context menu' })).toHaveCount(0);
    await page.locator('.tiptap:visible').click({ button: 'right' });
    await expect(page.getByRole('menu', { name: 'Context menu' })).toHaveCount(0);
    await chapter.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Open', exact: true })).toBeVisible();
});

test('renames inline, cancels with Escape, validates blanks and updates the open tab', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const chapter = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    const input = page.getByRole('textbox', { name: 'Item name', exact: true });
    await chapter.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Chapter A');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await input.fill('Cancelled');
    await input.press('Escape');
    await expect(input).toHaveCount(0);
    await expect(chapter).toBeVisible();
    await chapter.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
    await input.fill('   ');
    await input.press('Enter');
    await expect(page.getByRole('alert')).toContainText('Enter a name.');
    await input.fill('  Revised chapter  ');
    await input.press('Enter');
    await expect(input).toHaveCount(0);
    await expect(
        page.getByRole('treeitem', { name: 'Revised chapter', exact: true }),
    ).toBeVisible();
    await expect(workspaceTab(page, 'Revised chapter')).toBeVisible();
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls.filter((call) => call.command === 'update_node'),
        ),
    ).toHaveLength(1);
});

test('keeps a failed rename editable and retries on blur', async ({ page, workspace }) => {
    await workspace.open('rename-error');
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Item name', exact: true });
    await input.fill('Retried name');
    await input.press('Enter');
    await expect(page.getByRole('alert')).toContainText('The item could not be renamed.');
    await expect(input).toHaveValue('Retried name');
    await page.getByRole('textbox', { name: 'Filter manuscript' }).click();
    await expect(input).toHaveCount(0);
    await expect(page.getByRole('treeitem', { name: 'Retried name', exact: true })).toBeVisible();
});

test('creates the requested document kind inside the clicked folder through its submenu', async ({
    page,
    workspace,
}) => {
    await workspace.open('tree-state');
    await page.getByRole('treeitem', { name: 'Draft', exact: true }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'New File', exact: true }).hover();
    const wiki = page.getByRole('menuitem', { name: 'New Wiki', exact: true });
    await expect(wiki).toBeVisible();
    await wiki.click({ button: 'right' });
    await expect(wiki).toBeVisible();
    await wiki.click();
    const input = page.getByRole('textbox', { name: 'New item name' });
    await expect(input).toBeFocused();
    await input.fill('Nested wiki');
    await input.press('Enter');
    await expect(input).toHaveCount(0);
    await expect(page.getByRole('treeitem', { name: 'Nested wiki', exact: true })).toHaveAttribute(
        'aria-level',
        '2',
    );
    expect(
        await page.evaluate(
            () =>
                window.__kazmasTest.calls.find((call) => call.command === 'create_wiki_entry')
                    ?.args,
        ),
    ).toEqual({ name: 'Nested wiki', parentId: 'draft-folder' });
});

test('moves a folder branch to Trash and closes only its tabs after saving', async ({
    page,
    workspace,
}) => {
    await workspace.open('tree-state');
    const draft = page.getByRole('treeitem', { name: 'Draft', exact: true });
    await draft.locator('.tree-chevron-icon').click();
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await page.locator('.tiptap:visible').fill('Pending before trash');
    await page
        .getByRole('treeitem', { name: 'Archive', exact: true })
        .locator('.tree-chevron-icon')
        .click();
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await draft.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await expect(draft).toHaveCount(0);
    await expect(workspaceTab(page, 'Chapter A')).toHaveCount(0);
    await expect(workspaceTab(page, 'Chapter B')).toBeVisible();
    const calls = await page.evaluate(() => window.__kazmasTest.calls);
    const save = calls.findIndex(
        (call) => call.command === 'update_document' && call.args.nodeId === 'entry-a',
    );
    const trash = calls.findIndex((call) => call.command === 'delete_node');
    expect(save).toBeGreaterThan(-1);
    expect(trash).toBeGreaterThan(save);
});

test('closes tabs to the right, other tabs and all tabs without activating a right-clicked tab', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await page.getByRole('treeitem').last().click();
    const chapterA = workspaceTab(page, 'Chapter A');
    const chapterB = workspaceTab(page, 'Chapter B');
    await chapterB.click({ button: 'right' });
    await expect(chapterB).toHaveAttribute('aria-selected', 'false');
    await page.getByRole('menuitem', { name: 'Close Tabs to the Right', exact: true }).click();
    await expect(page.getByRole('tab')).toHaveCount(2);
    await chapterB.click({ button: 'right' });
    await expect(
        page.getByRole('menuitem', { name: 'Close Tabs to the Right', exact: true }),
    ).toBeDisabled();
    await page.getByRole('menuitem', { name: 'Close Other Tabs', exact: true }).click();
    await expect(chapterA).toHaveCount(0);
    await chapterB.click({ button: 'right' });
    await expect(
        page.getByRole('menuitem', { name: 'Close Other Tabs', exact: true }),
    ).toBeDisabled();
    await page.getByRole('menuitem', { name: 'Close All Tabs', exact: true }).click();
    await expect(page.getByRole('tab')).toHaveCount(0);
});

test('reveals a distant node repeatedly and focuses it without changing the active tab', async ({
    page,
    workspace,
}) => {
    await workspace.open('large-tree');
    const tree = page.getByRole('tree', { name: 'Manuscript' });
    const first = tree.getByRole('treeitem', { name: 'Chapter 00000', exact: true });
    await first.click();
    await first.focus();
    await page.keyboard.press('End');
    const last = tree.getByRole('treeitem', { name: 'Chapter 19999', exact: true });
    await expect(last).toBeFocused();
    await last.press('Enter');
    const firstTab = workspaceTab(page, 'Chapter 00000');
    const lastTab = workspaceTab(page, 'Chapter 19999');
    for (let attempt = 0; attempt < 2; attempt++) {
        await firstTab.click({ button: 'right' });
        await page.getByRole('menuitem', { name: 'Reveal in Tree', exact: true }).click();
        await expect(first).toBeFocused();
        await expect(lastTab).toHaveAttribute('aria-selected', 'true');
        await first.press('ArrowDown');
        await expect(
            tree.getByRole('treeitem', { name: 'Chapter 00001', exact: true }),
        ).toBeFocused();
        await tree.locator('..').evaluate((element) => {
            element.scrollTop = element.scrollHeight;
        });
        await expect(last).toBeVisible();
    }
});

test('reveals a node in another section and reopens a collapsed sidebar', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const chapter = workspaceTab(page, 'Chapter A');
    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await page.getByRole('treeitem', { name: 'Character', exact: true }).click();
    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await chapter.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Reveal in Tree', exact: true }).click();
    await expect(page.getByRole('treeitem', { name: 'Chapter A', exact: true })).toBeFocused();
    await expect(workspaceTab(page, 'Character')).toHaveAttribute('aria-selected', 'true');
});

test('creates a root wiki from the manuscript background menu', async ({ page, workspace }) => {
    await workspace.open();
    await page
        .locator('[data-slot="sidebar-content"]:visible')
        .filter({ has: page.getByRole('tree', { name: 'Manuscript' }) })
        .click({ button: 'right', position: { x: 180, y: 200 } });
    await page.getByRole('menuitem', { name: 'New File', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'New Wiki', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'New item name' });
    await expect(input).toBeFocused();
    await input.fill('Root wiki');
    await input.press('Enter');
    await expect(page.getByRole('tree', { name: 'Wiki' })).toBeVisible();
    await expect(page.getByRole('treeitem', { name: 'Root wiki', exact: true })).toHaveAttribute(
        'aria-level',
        '1',
    );
});

test('keeps tabs and nodes when saving fails before close or Trash', async ({
    page,
    workspace,
}) => {
    await workspace.open('write-blocked');
    const chapter = workspaceTab(page, 'Chapter A');
    const node = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    await page.locator('.tiptap:visible').fill('Unsaved content');
    await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
    await chapter.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Close All Tabs', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('could not be saved');
    await expect(page.getByRole('tab')).toHaveCount(2);
    await expect(chapter).toHaveAttribute('aria-selected', 'true');
    await node.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await expect(
        page.getByRole('alert').filter({ hasText: 'could not be moved to Trash' }),
    ).toBeVisible();
    await expect(node).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(2);
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls.filter((call) => call.command === 'delete_node'),
        ),
    ).toHaveLength(0);
});
