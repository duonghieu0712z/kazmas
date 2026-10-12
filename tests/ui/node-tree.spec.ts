import { expect, test } from './fixtures';

test('reload restores each tree state and the active activity', async ({ page, workspace }) => {
    await workspace.open('tree-state');

    await page
        .getByRole('treeitem', { name: 'Draft', exact: true })
        .locator('.tree-chevron-icon')
        .click();
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toBeFocused();
    await page.getByRole('textbox', { name: 'Filter manuscript' }).fill('Chapter A');
    await expect(page.getByRole('treeitem')).toHaveCount(2);
    await page.getByRole('button', { name: 'Collapse all', exact: true }).click();

    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await page
        .getByRole('treeitem', { name: 'Characters', exact: true })
        .locator('.tree-chevron-icon')
        .click();
    await page.getByRole('treeitem', { name: 'Character', exact: true }).click();
    await expect(page.locator('.tiptap:visible')).toBeFocused();
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
        await expect(page.getByRole('textbox', { name: 'New item name' })).toBeFocused();
        await page.getByRole('textbox', { name: 'New item name' }).press('Enter');

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
        await expect(page.getByRole('textbox', { name: 'New item name' })).toBeFocused();
        await page.getByRole('textbox', { name: 'New item name' }).press('Enter');
        await expect(page.getByRole('treeitem', { name: 'Untitled', exact: true })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        await expect(page.locator('main').locator('..').getByRole('navigation')).toContainText(
            'Untitled',
        );
        await expect(page.locator('.tiptap:visible')).toBeVisible();
    });
}

for (const kind of ['folder', 'entry']) {
    test(`clicking outside discards a blank ${kind} and creates a named one`, async ({
        page,
        workspace,
    }) => {
        await workspace.open();
        const create = page.getByRole('button', {
            name: kind === 'folder' ? 'New folder' : 'New manuscript entry',
            exact: true,
        });
        const input = page.getByRole('textbox', { name: 'New item name' });
        const outside = page.getByRole('textbox', { name: 'Filter manuscript' });
        const initialCount = await page.getByRole('treeitem').count();
        for (const name of ['', '   ']) {
            await create.click();
            await input.fill(name);
            await outside.click();
            await expect(input).toHaveCount(0);
            await expect(page.getByRole('treeitem')).toHaveCount(initialCount);
        }
        await create.click();
        await input.fill('  New item  ');
        await outside.click();
        await expect(input).toHaveCount(0);
        await expect(page.getByRole('treeitem', { name: 'New item', exact: true })).toBeVisible();
        await expect(page.getByRole('treeitem')).toHaveCount(initialCount + 1);
    });
}

test('Escape discards a named draft', async ({ page, workspace }) => {
    await workspace.open();
    const initialCount = await page.getByRole('treeitem').count();
    await page.getByRole('button', { name: 'New folder', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'New item name' });
    await input.fill('Cancelled');
    await input.press('Escape');
    await expect(input).toHaveCount(0);
    await expect(page.getByRole('treeitem')).toHaveCount(initialCount);
});

for (const section of ['Manuscript', 'Wiki'] as const) {
    for (const type of ['entry', 'folder'] as const) {
        for (const selectFolder of [true, false]) {
            test(`creates a ${type} from a selected ${selectFolder ? 'folder' : 'file'} in ${section}`, async ({
                page,
                workspace,
            }) => {
                await workspace.open('tree-state');
                if (section === 'Wiki') {
                    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
                }
                const folderName = section === 'Wiki' ? 'Characters' : 'Draft';
                const folderId = section === 'Wiki' ? 'wiki-folder' : 'draft-folder';
                const folder = page.getByRole('treeitem', { name: folderName, exact: true });
                if (selectFolder) {
                    await folder.click();
                } else {
                    await folder.locator('.tree-chevron-icon').click();
                    await page
                        .getByRole('treeitem', {
                            name: section === 'Wiki' ? 'Character' : 'Chapter A',
                            exact: true,
                        })
                        .click();
                }
                await page.getByRole('button', { name: 'Collapse all', exact: true }).click();
                await page
                    .getByRole('button', {
                        name:
                            type === 'folder' ? 'New folder' : `New ${section.toLowerCase()} entry`,
                        exact: true,
                    })
                    .click();
                const input = page.getByRole('textbox', { name: 'New item name' });
                await expect(input).toBeFocused();
                await expect(page.getByRole('treeitem').filter({ has: input })).toHaveAttribute(
                    'aria-level',
                    '2',
                );
                expect(
                    await input.evaluate((element) => element.getBoundingClientRect().height),
                ).toBe(16);
                await input.fill('  New child  ');
                await input.press('Enter');
                await expect(input).toHaveCount(0);
                const created = page.getByRole('treeitem', { name: 'New child', exact: true });
                await expect(created).toHaveAttribute('aria-level', '2');
                await expect(created).toHaveAttribute('aria-selected', 'true');
                const command =
                    type === 'folder'
                        ? 'create_folder'
                        : section === 'Wiki'
                          ? 'create_wiki_entry'
                          : 'create_manuscript_entry';
                const calls = await page.evaluate(
                    (command) =>
                        window.__kazmasTest.calls.filter((call) => call.command === command),
                    command,
                );
                expect(calls).toHaveLength(1);
                expect(calls[0]!.args).toMatchObject({ name: 'New child', parentId: folderId });
                if (type === 'folder') {
                    expect(calls[0]!.args.section).toBe(section.toLowerCase());
                }
            });
        }
    }
}

test('creates a child inside an empty folder and keeps draft navigation out of the editor', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    await page.getByRole('button', { name: 'New folder', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'New item name' });
    await input.fill('Empty folder');
    await input.press('Enter');
    const folder = page.getByRole('treeitem', { name: 'Empty folder', exact: true });
    await expect(folder).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'New manuscript entry', exact: true }).click();
    await expect(input).toBeFocused();
    const draft = page.getByRole('treeitem').filter({ has: input });
    await expect(draft).toHaveAttribute('aria-level', '2');
    await expect(draft).toHaveAttribute('aria-selected', 'false');
    await expect(folder).toHaveAttribute('aria-expanded', 'true');
    await input.fill('Child');
    await input.press('Enter');
    await expect(page.getByRole('treeitem', { name: 'Child', exact: true })).toHaveAttribute(
        'aria-level',
        '2',
    );
    await expect(page.locator('main').locator('..').getByRole('navigation')).toContainText(
        'Empty folder',
    );
});
