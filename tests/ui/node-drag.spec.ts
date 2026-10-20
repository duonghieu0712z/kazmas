import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

async function startDrag(page: Page, source: Locator) {
    const bounds = (await source.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 8, bounds.y + bounds.height / 2, {
        steps: 3,
    });
    await expect(page.locator('[data-slot="node-drag-preview"]')).toBeVisible();
}

async function moveTo(page: Page, target: Locator, fraction = 0.5) {
    const bounds = (await target.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height * fraction, {
        steps: 8,
    });
}

test('reorders manuscript nodes without activating the dragged document', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const first = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    const second = page.getByRole('treeitem', { name: 'Chapter B', exact: true });
    await startDrag(page, second);
    await moveTo(page, first, 0.1);
    await expect(first).toHaveAttribute('data-drop-placement', 'before');
    await page.mouse.up();
    await expect(page.getByRole('treeitem').nth(0)).toHaveAccessibleName('Chapter B');
    await expect(page.locator('.tiptap:visible')).toContainText('A sample manuscript');
    await expect(page.getByRole('tab')).toHaveCount(1);
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls
                .filter((call) => call.command === 'move_manuscript_node')
                .map((call) => call.args),
        ),
    ).toEqual([{ nodeId: 'entry-b', targetId: 'entry-a', placement: 'before' }]);
});

test('drops on the tree background to append a node after its siblings', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const tree = page.locator('[data-node-tree="Manuscript"]');
    const rootId = await tree.getAttribute('data-root-id');
    expect(rootId).toBeTruthy();
    await startDrag(page, page.getByRole('treeitem', { name: 'Chapter A', exact: true }));
    await moveTo(page, tree, 0.9);
    await page.mouse.up();
    await expect(page.getByRole('treeitem').nth(0)).toHaveAccessibleName('Chapter B');
    await expect(page.getByRole('treeitem').last()).toHaveAccessibleName('Chapter A');
    await expect(page.getByRole('tab')).toHaveCount(1);
    await expect(page.locator('[data-slot="node-drag-preview"]')).toHaveCount(0);
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls
                .filter((call) => call.command === 'move_manuscript_node')
                .map((call) => call.args),
        ),
    ).toEqual([{ nodeId: 'entry-a', targetId: rootId, placement: 'inside' }]);
});

for (const event of ['blur', 'pointercancel']) {
    test(`cancels dragging on ${event} and allows the next click and drag`, async ({
        page,
        workspace,
    }) => {
        await workspace.open();
        const first = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
        const second = page.getByRole('treeitem', { name: 'Chapter B', exact: true });
        await startDrag(page, second);
        await moveTo(page, first, 0.1);
        await expect(first).toHaveAttribute('data-drop-placement', 'before');
        await page.evaluate((type) => {
            if (type === 'blur') {
                window.dispatchEvent(new Event(type));
            } else {
                document.dispatchEvent(new PointerEvent(type));
            }
        }, event);
        await expect(page.locator('[data-slot="node-drag-preview"]')).toHaveCount(0);
        await expect(first).not.toHaveAttribute('data-drop-placement');
        await page.mouse.up();
        await expect(page.getByRole('treeitem').nth(0)).toHaveAccessibleName('Chapter A');
        expect(
            await page.evaluate(() =>
                window.__kazmasTest.calls.some((call) => call.command === 'move_manuscript_node'),
            ),
        ).toBe(false);
        await second.click();
        await expect(
            page.getByRole('tab', { name: 'Chapter B Close Chapter B', exact: true }),
        ).toHaveAttribute('aria-selected', 'true');
        await startDrag(page, first);
        await moveTo(page, second, 0.9);
        await expect(second).toHaveAttribute('data-drop-placement', 'after');
        await page.mouse.up();
        await expect(page.getByRole('treeitem').nth(0)).toHaveAccessibleName('Chapter B');
        await expect(page.getByRole('treeitem').nth(1)).toHaveAccessibleName('Chapter A');
    });
}

test('moves entries into folders and back to the root and rejects cycles', async ({
    page,
    workspace,
}) => {
    await workspace.open('tree-state');
    const draft = page.getByRole('treeitem', { name: 'Draft', exact: true });
    const archive = page.getByRole('treeitem', { name: 'Archive', exact: true });
    await page.getByRole('button', { name: 'Expand all', exact: true }).click();
    const chapter = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    await startDrag(page, chapter);
    await moveTo(page, archive);
    await expect(archive).toHaveAttribute('data-drop-placement', 'inside');
    await page.mouse.up();
    await expect(chapter).toHaveAttribute('aria-level', '2');
    await startDrag(page, chapter);
    await moveTo(page, draft, 0.1);
    await page.mouse.up();
    await expect(chapter).toHaveAttribute('aria-level', '1');
    await startDrag(page, draft);
    await moveTo(page, draft);
    await expect(draft).not.toHaveAttribute('data-drop-placement');
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await startDrag(page, draft);
    await moveTo(page, archive);
    await page.mouse.up();
    await expect(draft).toHaveAttribute('aria-level', '2');
    await startDrag(page, archive);
    await moveTo(page, draft);
    await expect(draft).not.toHaveAttribute('data-drop-placement');
    await page.mouse.up();
});

test('drops a node over the editor to open its tab without inserting text', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const editor = page.locator('.tiptap:visible');
    await editor.fill('Keep this draft');
    await startDrag(page, page.getByRole('treeitem', { name: 'Chapter B', exact: true }));
    await moveTo(page, editor);
    await expect(page.locator('[data-node-drop="content"]')).toHaveClass(/outline-ring/);
    await page.mouse.up();
    await expect(page.getByRole('tab')).toHaveCount(2);
    await expect(
        page.getByRole('tab', { name: 'Chapter B Close Chapter B', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await page
        .getByRole('tab')
        .filter({ hasText: /^Chapter A$/ })
        .click();
    await expect(editor).toHaveText('Keep this draft');
    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    await startDrag(page, page.getByRole('treeitem', { name: 'Character', exact: true }));
    await moveTo(page, editor);
    await page.mouse.up();
    await expect(
        page.getByRole('tab', { name: 'Character Close Character', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
});

test('drops an entire branch on Trash after saving and closes its tabs', async ({
    page,
    workspace,
}) => {
    await workspace.open('tree-state');
    await page.getByRole('button', { name: 'Expand all', exact: true }).click();
    await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
    await page.locator('.tiptap:visible').fill('Save before trash');
    await startDrag(page, page.getByRole('treeitem', { name: 'Draft', exact: true }));
    await moveTo(page, page.getByRole('button', { name: 'Trash', exact: true }));
    await page.mouse.up();
    await expect(page.getByRole('treeitem', { name: 'Draft', exact: true })).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    const commands = await page.evaluate(() =>
        window.__kazmasTest.calls.map((call) => call.command),
    );
    const saveIndex = commands.lastIndexOf('update_document');
    const deleteIndex = commands.indexOf('delete_node');
    expect(saveIndex).toBeGreaterThanOrEqual(0);
    expect(deleteIndex).toBeGreaterThan(saveIndex);
    await page.getByRole('button', { name: 'Trash', exact: true }).click();
    await expect(page.getByRole('treeitem', { name: 'Draft', exact: true })).toBeVisible();
});

test('cancels on Escape and rejects folder drops onto content', async ({ page, workspace }) => {
    await workspace.open('tree-state');
    const draft = page.getByRole('treeitem', { name: 'Draft', exact: true });
    await startDrag(page, draft);
    await moveTo(page, page.locator('[data-node-drop="content"]'));
    await expect(page.locator('[data-node-drop="content"]')).not.toHaveClass(/outline-ring/);
    await page.mouse.up();
    await startDrag(page, draft);
    await moveTo(page, page.getByRole('button', { name: 'Trash', exact: true }));
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-slot="node-drag-preview"]')).toHaveCount(0);
    await page.mouse.up();
    await expect(draft).toBeVisible();
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls.some((call) => call.command === 'delete_node'),
        ),
    ).toBe(false);
});

test('reports failed moves and preserves the original tree order', async ({ page, workspace }) => {
    await workspace.open('move-error');
    const second = page.getByRole('treeitem', { name: 'Chapter B', exact: true });
    await startDrag(page, second);
    await moveTo(page, page.getByRole('treeitem', { name: 'Chapter A', exact: true }), 0.1);
    await page.mouse.up();
    await expect(page.getByRole('alert')).toContainText('The item could not be moved.');
    await expect(page.getByRole('treeitem').nth(0)).toHaveAccessibleName('Chapter A');
});

test('preserves branches and tabs when saving before a Trash drop fails', async ({
    page,
    workspace,
}) => {
    await workspace.open('write-blocked');
    await page.locator('.tiptap:visible').fill('Unsaved draft');
    const chapter = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    await startDrag(page, chapter);
    await moveTo(page, page.getByRole('button', { name: 'Trash', exact: true }));
    await page.mouse.up();
    await expect(
        page.getByRole('alert').filter({ hasText: 'The item could not be moved to Trash.' }),
    ).toBeVisible();
    await expect(chapter).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(1);
    await expect(page.locator('.tiptap:visible')).toHaveText('Unsaved draft');
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls.some((call) => call.command === 'delete_node'),
        ),
    ).toBe(false);
});

test('does not reorder a filtered manuscript tree or a Wiki tree', async ({ page, workspace }) => {
    await workspace.open();
    await page.getByRole('textbox', { name: 'Filter manuscript', exact: true }).fill('Chapter');
    const first = page.getByRole('treeitem', { name: 'Chapter A', exact: true });
    await startDrag(page, page.getByRole('treeitem', { name: 'Chapter B', exact: true }));
    await moveTo(page, first, 0.1);
    await expect(first).not.toHaveAttribute('data-drop-placement');
    await page.mouse.up();
    await page.getByRole('button', { name: 'Wiki', exact: true }).click();
    const character = page.getByRole('treeitem', { name: 'Character', exact: true });
    await startDrag(page, character);
    await moveTo(page, character, 0.1);
    await page.mouse.up();
    expect(
        await page.evaluate(() =>
            window.__kazmasTest.calls.some((call) => call.command === 'move_manuscript_node'),
        ),
    ).toBe(false);
});

test('expands a hovered folder and scrolls a virtualized tree during dragging', async ({
    page,
    workspace,
}) => {
    await workspace.open('tree-state');
    const draft = page.getByRole('treeitem', { name: 'Draft', exact: true });
    const archive = page.getByRole('treeitem', { name: 'Archive', exact: true });
    await startDrag(page, draft);
    await moveTo(page, archive);
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await workspace.open('large-tree');
    const source = page.getByRole('treeitem', { name: 'Chapter 00000', exact: true });
    const viewport = page
        .locator('[data-node-tree="Manuscript"]')
        .locator('xpath=ancestor-or-self::*[@data-slot="scroll-area-viewport"][1]');
    await startDrag(page, source);
    const bounds = (await viewport.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height - 5, { steps: 8 });
    await expect
        .poll(async () => await viewport.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(200);
    await expect(page.locator('[data-slot="node-drag-preview"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.mouse.up();
});
