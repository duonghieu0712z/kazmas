import { expect, test } from './fixtures';

test('reload restores each tree state and the active activity', async ({ page, workspace }) => {
    await workspace.open('tree-state');

    await page
        .getByRole('treeitem', { name: 'Draft', exact: true })
        .locator('.tree-chevron-icon')
        .click();
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await page.getByRole('textbox', { name: 'Filter manuscript' }).fill('Chapter A');
    await page.getByRole('button', { name: 'Collapse all', exact: true }).click();

    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await page
        .getByRole('treeitem', { name: 'Characters', exact: true })
        .locator('.tree-chevron-icon')
        .click();
    await page.getByRole('treeitem', { name: 'Character', exact: true }).click();
    await page.getByRole('textbox', { name: 'Filter wiki' }).fill('Character');

    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Filter wiki' })).toHaveValue('Character');
    await expect(page.getByRole('treeitem', { name: 'Character', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
    );

    await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Filter manuscript' })).toHaveValue('Chapter A');
    await expect(page.getByRole('treeitem')).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear filter', exact: true }).click();
    await expect(page.getByRole('treeitem', { name: 'Draft', exact: true })).toHaveAttribute(
        'aria-expanded',
        'true',
    );
    await expect(page.getByRole('treeitem', { name: 'Archive', exact: true })).toHaveAttribute(
        'aria-expanded',
        'false',
    );
    await expect(page.getByRole('treeitem', { name: 'Chapter A', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
    );
});

test('header actions show tooltips including disabled expansion controls', async ({
    page,
    workspace,
}) => {
    await workspace.open();

    const header = page.locator('[data-slot="sidebar-header"]').filter({ hasText: 'Manuscript' });
    await expect(header.getByRole('group', { name: 'Tree actions' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Expand all', exact: true })).toBeDisabled();
    await expect(header.getByRole('button', { name: 'Collapse all', exact: true })).toBeDisabled();

    for (const label of ['New manuscript entry', 'New folder', 'Expand all', 'Collapse all']) {
        const button = header.getByRole('button', { name: label, exact: true });
        await button.locator('..').hover();
        await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible();
        await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveText(label);
        await page.mouse.move(1100, 700);
        await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
    }

    await page.getByRole('textbox', { name: 'Filter manuscript' }).fill('chapter');
    await header.getByRole('button', { name: 'Clear filter', exact: true }).locator('..').hover();
    await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible();
    await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveText('Clear filter');
});

test('tree filters stay separate across activity switches', async ({ page, workspace }) => {
    await workspace.open();
    await expect(
        page.locator('[data-slot="sidebar-header"]').getByText('Manuscript', { exact: true }),
    ).toBeVisible();
    await page.getByRole('textbox', { name: 'Filter manuscript' }).fill('chapter b');
    await expect(page.getByRole('treeitem')).toHaveCount(1);
    await expect(page.getByRole('treeitem')).toHaveText('Chapter B');
    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await page.getByRole('textbox', { name: 'Filter wiki' }).fill('missing');
    await expect(page.getByRole('status')).toHaveText('No matching items.');
    await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Filter manuscript' })).toHaveValue('chapter b');
    await expect(page.getByRole('treeitem')).toHaveText('Chapter B');
    await page.getByRole('textbox', { name: 'Filter manuscript' }).press('Escape');
    await expect(page.getByRole('treeitem')).toHaveCount(3);
});

test('short and truncated names both show tooltips', async ({ page, workspace }) => {
    await workspace.open();
    await page
        .getByRole('treeitem', { name: 'Chapter A', exact: true })
        .locator('[data-slot="tooltip-trigger"]')
        .hover();
    await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible();
    await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveText('Chapter A');
    await page.mouse.move(1100, 700);
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
    const longItem = page.getByRole('treeitem').last();
    const name = await longItem.innerText();
    await longItem.locator('[data-slot="tooltip-trigger"]').hover();
    await expect(page.locator('[data-slot="tooltip-content"]')).toBeVisible();
    await expect(page.getByRole('tooltip', { includeHidden: true })).toHaveText(name);
});

for (const section of ['Manuscript', 'Wiki']) {
    test(`header creates a folder in ${section}`, async ({ page, workspace }) => {
        await workspace.open();
        if (section === 'Wiki') {
            await page.getByRole('button', { name: 'Wiki', exact: true }).click();
        }

        await page.getByRole('button', { name: 'New folder', exact: true }).click();

        await expect(page.getByRole('treeitem', { name: 'Untitled', exact: true })).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });

    test(`header creates and opens a ${section} entry`, async ({ page, workspace }) => {
        await workspace.open();
        if (section === 'Wiki') {
            await page.getByRole('button', { name: 'Wiki', exact: true }).click();
        }
        await page.getByRole('button', { name: `New ${section.toLowerCase()} entry` }).click();
        await expect(page.getByRole('treeitem', { name: 'Untitled', exact: true })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        await expect(page.locator('main').locator('..').getByRole('navigation')).toContainText(
            'Untitled',
        );
        await expect(page.locator('.tiptap')).toBeVisible();
    });
}
