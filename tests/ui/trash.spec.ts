import { expect, test } from './fixtures';

test('sorts folders before files alphabetically at every level within each source', async ({
    page,
    workspace,
}) => {
    await workspace.open('trash-order');
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    const trash = page.getByRole('region', { name: 'Trash', exact: true });
    await page
        .getByRole('group', { name: 'Manuscript trash actions', exact: true })
        .getByRole('button', { name: 'Expand all', exact: true })
        .click();
    await expect
        .poll(
            async () =>
                await trash
                    .getByRole('treeitem')
                    .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label'))),
        )
        .toEqual([
            'apple folder',
            'apple subfolder',
            'Zebra subfolder',
            'apple child',
            'Zebra child',
            'Zebra folder',
            'apple file',
            'Zebra file',
            'apple topics',
            'Zebra topics',
            'apple page',
        ]);
});

test('groups trash by source and shows the original location of separately deleted items', async ({
    page,
    workspace,
}) => {
    await workspace.open('tree-state');
    const draft = page.getByRole('treeitem', { name: 'Draft', exact: true });
    await draft.locator('.tree-chevron-icon').click();
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await page
        .getByRole('treeitem', { name: 'Characters', exact: true })
        .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    const trash = page.getByRole('region', { name: 'Trash', exact: true });
    const manuscript = trash.getByRole('group', { name: 'Manuscript', exact: true });
    const wiki = trash.getByRole('group', { name: 'Wiki', exact: true });
    await expect(manuscript).toBeVisible();
    await expect(wiki).toBeVisible();
    const chapter = trash.getByRole('treeitem', { name: 'Chapter A', exact: true });
    await expect(chapter).toHaveAttribute('aria-level', '1');
    await expect(chapter.getByText('Manuscript / Draft', { exact: true })).toBeVisible();
    await chapter.getByText('Chapter A', { exact: true }).hover();
    await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveText('Chapter A');
    await page.mouse.move(1100, 700);
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
    await chapter.getByText('Manuscript / Draft', { exact: true }).hover();
    await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveText(
        'Original location: Manuscript / Draft',
    );
    await page.mouse.move(1100, 700);
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
    await expect(trash.getByRole('treeitem', { name: 'Characters', exact: true })).toHaveAttribute(
        'aria-level',
        '1',
    );
    await wiki.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Restore', exact: true })).toHaveCount(0);
    await expect(manuscript.locator('[data-slot="sidebar-group-label"]')).toHaveText('Manuscript');
    const toggle = manuscript.getByRole('button', { name: 'Toggle Manuscript trash' });
    await expect(toggle.locator('svg')).toHaveCount(1);
    await expect(manuscript.locator('[data-slot="sidebar-group-label"]')).toHaveCSS(
        'background-color',
        await page.evaluate(() => {
            const probe = document.createElement('div');
            probe.className = 'bg-muted';
            document.body.append(probe);
            const color = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return color;
        }),
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(chapter).toHaveCount(0);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(chapter).toBeVisible();
    await page.getByRole('textbox', { name: 'Filter trash' }).fill('Character');
    await expect(wiki).toBeVisible();
    await expect(manuscript).toBeVisible();
    await expect(manuscript.getByRole('treeitem')).toHaveCount(0);
});

test('restores a trashed branch and confirms permanent deletion', async ({ page, workspace }) => {
    await workspace.open('tree-state');
    const draft = page.getByRole('treeitem', { name: 'Draft', exact: true });
    await draft.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await expect(draft).toHaveCount(0);
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    const trash = page.getByRole('region', { name: 'Trash', exact: true });
    await expect(trash.getByText('Draft', { exact: true })).toBeVisible();
    await expect(trash.getByText('Chapter A', { exact: true })).toHaveCount(0);
    const trashedDraft = trash.getByRole('treeitem', { name: 'Draft', exact: true });
    await trashedDraft.locator('.tree-chevron-icon').click();
    await expect(trash.getByRole('treeitem', { name: 'Chapter A', exact: true })).toBeVisible();
    await trashedDraft.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Restore', exact: true }).click();
    await expect(trash.getByText('Trash is empty.')).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Manuscript', exact: true })).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Wiki', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
    await expect(draft).toBeVisible();
    await draft.click();
    await draft.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await expect(draft).toHaveCount(0);
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    await trashedDraft.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Delete Permanently', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(trash.getByText('Draft', { exact: true })).toBeVisible();
    await trashedDraft.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Delete Permanently', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete Permanently' }).click();
    await expect(trash.getByText('Trash is empty.')).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Manuscript', exact: true })).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Wiki', exact: true })).toBeVisible();
});

test('filters descendants within the tree and restores all from the icon toolbar', async ({
    page,
    workspace,
}) => {
    await workspace.open('tree-state');
    await page.getByRole('treeitem', { name: 'Draft', exact: true }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await expect(page.getByRole('treeitem', { name: 'Draft', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    const trash = page.getByRole('region', { name: 'Trash', exact: true });
    const draft = trash.getByRole('treeitem', { name: 'Draft', exact: true });
    await draft.focus();
    await page.keyboard.press('ArrowRight');
    await expect(trash.getByRole('treeitem', { name: 'Chapter A', exact: true })).toBeVisible();
    const expand = page
        .getByRole('group', { name: 'Manuscript trash actions', exact: true })
        .getByRole('button', { name: 'Expand all', exact: true });
    const collapse = page
        .getByRole('group', { name: 'Manuscript trash actions', exact: true })
        .getByRole('button', { name: 'Collapse all', exact: true });
    await collapse.click();
    await expect(trash.getByRole('treeitem', { name: 'Chapter A', exact: true })).toHaveCount(0);
    await expand.click();
    await expect(trash.getByRole('treeitem', { name: 'Chapter A', exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Filter trash' }).fill('Chapter A');
    await expect(draft).toBeVisible();
    await expect(trash.getByRole('treeitem', { name: 'Chapter A', exact: true })).toBeVisible();
    await collapse.click();
    await expect(trash.getByRole('treeitem', { name: 'Chapter A', exact: true })).toHaveCount(0);
    await expand.click();
    await expect(trash.getByRole('treeitem', { name: 'Chapter A', exact: true })).toBeVisible();
    const restore = page.getByRole('button', { name: 'Restore All', exact: true });
    const empty = page.getByRole('button', { name: 'Empty Trash', exact: true });
    await expect(restore).toHaveText('');
    await expect(empty).toHaveText('');
    await restore.click();
    await expect(trash.getByText('Trash is empty.')).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Manuscript', exact: true })).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Wiki', exact: true })).toBeVisible();
    await expect(restore).toBeDisabled();
    await expect(empty).toBeDisabled();
    await expect(expand).toBeDisabled();
    await expect(collapse).toBeDisabled();
    await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
    await expect(page.getByRole('treeitem', { name: 'Draft', exact: true })).toBeVisible();
});

test('filters trash and empties it through the application command', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await expect(page.getByRole('treeitem', { name: 'Chapter A', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    const trash = page.getByRole('region', { name: 'Trash', exact: true });
    await page.getByRole('textbox', { name: 'Filter trash' }).fill('missing');
    await expect(trash.getByText('No matching items.')).toBeVisible();
    await page.getByRole('textbox', { name: 'Filter trash' }).press('Escape');
    await expect(trash.getByText('Chapter A', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Empty Trash', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(trash.getByText('Chapter A', { exact: true })).toBeVisible();
    if (process.platform === 'darwin') {
        await page.evaluate(async () => await window.__kazmasTest.menuCommand('empty-trash'));
    } else {
        await page.getByRole('menuitem', { name: 'Project', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Empty Trash', exact: true }).click();
    }
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete Permanently' }).click();
    await expect(trash.getByText('Trash is empty.')).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Manuscript', exact: true })).toBeVisible();
    await expect(trash.getByRole('group', { name: 'Wiki', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Empty Trash', exact: true })).toBeDisabled();
});

test('resizes source panels and scrolls their content independently', async ({
    page,
    workspace,
}) => {
    await page.setViewportSize({ width: 1200, height: 480 });
    await workspace.open('trash-order');
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    await page
        .getByRole('group', { name: 'Manuscript trash actions', exact: true })
        .getByRole('button', { name: 'Expand all', exact: true })
        .click();
    const trash = page.getByRole('region', { name: 'Trash', exact: true });
    const panels = trash.locator('[data-slot="resizable-panel"]');
    await expect(
        trash
            .getByRole('group', { name: 'Manuscript', exact: true })
            .locator('[data-slot="scroll-area-viewport"]'),
    ).toHaveCSS('padding-top', '4px');
    await expect(
        trash
            .getByRole('group', { name: 'Manuscript', exact: true })
            .locator('[data-slot="scroll-area-viewport"]'),
    ).toHaveCSS('padding-left', '4px');
    await expect(panels).toHaveCount(2);
    const sidebarPanel = trash.locator('xpath=ancestor::*[@data-slot="resizable-panel"][1]');
    await expect(sidebarPanel).toHaveCSS('border-right-width', '1px');
    await expect(sidebarPanel).toHaveCSS('border-top-left-radius', '6px');
    const handle = trash.getByRole('separator');
    const before = await panels.first().boundingBox();
    await handle.focus();
    await page.keyboard.press('ArrowUp');
    await expect
        .poll(async () => (await panels.first().boundingBox())?.height)
        .toBeLessThan(before!.height);
    const manuscript = trash.getByRole('group', { name: 'Manuscript', exact: true });
    const wiki = trash.getByRole('group', { name: 'Wiki', exact: true });
    const header = manuscript.getByRole('button', { name: 'Toggle Manuscript trash' });
    const headerBefore = await header.boundingBox();
    const viewport = manuscript.locator(
        '[data-slot="sidebar-group-content"] [data-slot="scroll-area-viewport"]',
    );
    await viewport.hover();
    await page.mouse.wheel(0, 300);
    await expect
        .poll(async () => await viewport.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
    await expect.poll(async () => (await header.boundingBox())?.y).toBe(headerBefore!.y);
    await expect(wiki.locator('[data-slot="scroll-area-viewport"]')).toHaveJSProperty(
        'scrollTop',
        0,
    );
});

test('group actions expand and collapse only their own tree', async ({ page, workspace }) => {
    await workspace.open('tree-state');
    await page.getByRole('treeitem', { name: 'Draft', exact: true }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await page
        .getByRole('treeitem', { name: 'Characters', exact: true })
        .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Move to Trash', exact: true }).click();
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    const trash = page.getByRole('region', { name: 'Trash', exact: true });
    const manuscript = trash.getByRole('group', { name: 'Manuscript', exact: true });
    const wiki = trash.getByRole('group', { name: 'Wiki', exact: true });
    const toolbar = page.getByRole('group', { name: 'Trash actions', exact: true });
    await expect(toolbar.getByRole('button')).toHaveCount(2);
    await manuscript.getByRole('button', { name: 'Expand all', exact: true }).click();
    await expect(
        manuscript.getByRole('treeitem', { name: 'Chapter A', exact: true }),
    ).toBeVisible();
    await expect(wiki.getByRole('treeitem', { name: 'Character', exact: true })).toHaveCount(0);
    await wiki.getByRole('button', { name: 'Expand all', exact: true }).click();
    await manuscript.getByRole('button', { name: 'Collapse all', exact: true }).click();
    await expect(manuscript.getByRole('treeitem', { name: 'Chapter A', exact: true })).toHaveCount(
        0,
    );
    await expect(wiki.getByRole('treeitem', { name: 'Character', exact: true })).toBeVisible();
});
