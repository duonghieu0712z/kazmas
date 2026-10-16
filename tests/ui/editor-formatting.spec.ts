import type { Page } from '@playwright/test';

import { expect, showToolbarControl, test } from './fixtures';

async function selectTarget(page: Page) {
    const editor = page.locator('.tiptap:visible');
    await editor.fill('Before target after');
    await editor.evaluate((element) => {
        const text = element.querySelector('p')!.firstChild!;
        const range = document.createRange();
        range.setStart(text, 7);
        range.setEnd(text, 13);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        element.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('selectionchange'));
    });
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('target');
    return editor;
}

test('highlight palette preserves selection and remembers the color for the icon toggle', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const editor = await selectTarget(page);
    await page.getByRole('button', { name: 'Highlight colors', exact: true }).click();
    const palette = page.getByRole('dialog', { name: 'Highlight colors', exact: true });
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await palette.getByRole('button', { name: 'Green highlight', exact: true }).click();

    await expect(editor.locator('mark')).toHaveText('target');
    await expect(editor.locator('mark')).toHaveAttribute(
        'data-color',
        'var(--color-editor-highlight-green-background)',
    );
    await expect(editor).toBeFocused();
    await expect(page.getByRole('button', { name: 'Highlight', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
    );

    await page.getByRole('button', { name: 'Highlight', exact: true }).click();
    await expect(editor.locator('mark')).toHaveCount(0);
    await page.getByRole('button', { name: 'Highlight', exact: true }).click();
    await expect(editor.locator('mark')).toHaveAttribute(
        'data-color',
        'var(--color-editor-highlight-green-background)',
    );
});

test('font search loads lazily, preserves selection, and keeps the trigger at 120px', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const editor = await selectTarget(page);
    const font = page.getByRole('button', { name: 'Font family', exact: true });
    expect(
        await page.evaluate(
            () =>
                window.__kazmasTest.calls.filter((call) => call.command === 'get_system_fonts')
                    .length,
        ),
    ).toBe(0);
    await font.click();
    await expect(page.getByRole('option', { name: 'Default · Lora', exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Search fonts', exact: true }).fill('geist');
    await expect(page.getByRole('option', { name: 'Default · Lora', exact: true })).toHaveCount(0);
    await page.getByRole('option', { name: 'Geist', exact: true }).click();

    await expect(editor.locator('span[style*="font-family"]')).toHaveText('target');
    await expect(editor).toBeFocused();
    await expect(font).toHaveText('Geist');
    await expect(font).toHaveCSS('width', '120px');
    await expect(font).toHaveAttribute('aria-pressed', 'false');

    await font.click();
    await page.getByRole('combobox', { name: 'Search fonts', exact: true }).fill('not-a-font');
    await expect(page.getByText('No fonts found', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    expect(
        await page.evaluate(
            () =>
                window.__kazmasTest.calls.filter((call) => call.command === 'get_system_fonts')
                    .length,
        ),
    ).toBe(1);
});

test('line height defaults to 1.15 and applies a numeric preset to the selection', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const editor = await selectTarget(page);
    const ratio = await editor.locator('p').evaluate((element) => {
        const style = getComputedStyle(element);
        return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
    });
    expect(ratio).toBeCloseTo(1.15);

    await page.getByRole('button', { name: 'Line height', exact: true }).click();
    const palette = page.locator('[data-slot="popover-content"]');
    await expect(palette.getByRole('button', { name: '1.15', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
    );
    await expect(palette.getByRole('button', { name: /Default/ })).toHaveCount(0);
    await palette.getByRole('button', { name: '1.5', exact: true }).click();
    await expect(editor.locator('span[style*="line-height"]')).toHaveText('target');
    await expect(editor.locator('span[style*="line-height"]')).toHaveCSS('line-height', '24px');
    await expect(editor).toBeFocused();
});

for (const theme of ['light', 'dark'] as const) {
    test(`color pickers preserve the other highlight color and save custom colors in ${theme}`, async ({
        page,
        workspace,
    }) => {
        await page.addInitScript(
            (value) => localStorage.setItem('vueuse-color-scheme', value),
            theme,
        );
        await workspace.open();
        const editor = await selectTarget(page);
        await page.getByRole('button', { name: 'Highlight', exact: true }).click();
        const mark = editor.locator('mark');
        const background = await mark.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
        );

        await page.getByRole('button', { name: 'Text color', exact: true }).click();
        const foreground = page.getByRole('dialog', { name: 'Text color', exact: true });
        await foreground.getByRole('textbox', { name: 'Hex color', exact: true }).fill('#123456');
        await expect(mark).not.toHaveCSS('color', 'rgb(18, 52, 86)');
        await foreground.getByRole('button', { name: 'Apply', exact: true }).click();
        await expect(foreground).toHaveCount(0);
        await expect(mark).toHaveCSS('color', 'rgb(18, 52, 86)');
        await expect(mark).toHaveCSS('background-color', background);
        await expect(editor).toBeFocused();

        await page.getByRole('button', { name: 'Text background color', exact: true }).click();
        const backgroundPicker = page.getByRole('dialog', {
            name: 'Text background color',
            exact: true,
        });
        const hex = backgroundPicker.getByRole('textbox', { name: 'Hex color', exact: true });
        await hex.fill('#zzzzzz');
        await expect(hex).toHaveAttribute('aria-invalid', 'true');
        await expect(
            backgroundPicker.getByRole('button', { name: 'Apply', exact: true }),
        ).toBeDisabled();
        await hex.fill('#abcdef');
        await backgroundPicker.getByRole('button', { name: 'Apply', exact: true }).click();
        await expect(mark).toHaveCSS('background-color', 'rgb(171, 205, 239)');
        await expect(mark).toHaveCSS('color', 'rgb(18, 52, 86)');

        await page.getByRole('treeitem', { name: 'Chapter B', exact: true }).click();
        await page.getByRole('treeitem', { name: 'Chapter A', exact: true }).click();
        await expect(editor.locator('mark')).toHaveText('target');
        await expect(editor.locator('mark')).toHaveCSS('color', 'rgb(18, 52, 86)');
        await expect(editor.locator('mark')).toHaveCSS('background-color', 'rgb(171, 205, 239)');
    });
}

test('a plain text color preset closes its popup and draft changes can be canceled', async ({
    page,
    workspace,
}) => {
    await workspace.open();
    const editor = await selectTarget(page);
    await page.getByRole('button', { name: 'Text color', exact: true }).click();
    const palette = page.getByRole('dialog', { name: 'Text color', exact: true });
    await palette.getByRole('button', { name: 'Blue', exact: true }).click();
    await expect(palette).toHaveCount(0);
    await expect(editor).toBeFocused();
    const before = await editor.innerHTML();

    await page.getByRole('button', { name: 'Text color', exact: true }).click();
    const area = palette.getByRole('slider', { name: 'Saturation, Brightness', exact: true });
    await area.focus();
    const hex = palette.getByRole('textbox', { name: 'Hex color', exact: true });
    const initial = await hex.inputValue();
    await page.keyboard.press('ArrowLeft');
    await expect(hex).not.toHaveValue(initial);
    await expect(editor).toHaveJSProperty('innerHTML', before);
    await page.keyboard.press('Escape');
    await expect(palette).toHaveCount(0);
    await expect(editor).toHaveJSProperty('innerHTML', before);
});

test('new formatting controls are disabled in a read-only editor', async ({ page, workspace }) => {
    await workspace.open();
    await (await showToolbarControl(page, 'Switch to read-only')).click();

    for (const name of [
        'Font family',
        'Line height',
        'Text color',
        'Text background color',
        'Highlight',
    ]) {
        await expect(
            page.getByRole('button', { name, exact: true, includeHidden: true }),
        ).toBeDisabled();
    }
});

test('selection font size accepts decimals and clears to the document size', async ({ page }) => {
    await page.goto('?scenario=typography-controls');
    const editor = await selectTarget(page);
    const size = page.getByRole('button', { name: 'Font size', exact: true });
    await expect(size).toHaveText('16');
    await expect(size).toHaveCSS('width', '48px');
    await size.click();
    await expect(page.getByRole('option', { name: 'Default · 16', exact: true })).toBeVisible();
    const input = page.getByRole('combobox', { name: 'Font size in pixels', exact: true });
    await input.fill('0');
    await expect(page.getByRole('status')).toHaveText('Enter a positive number');
    await expect(page.getByRole('option')).toHaveCount(0);
    await input.fill('22.5');
    await page.getByRole('option', { name: '22.5', exact: true }).click();
    await expect(size).toHaveText('22.5');
    await expect(editor.locator('span')).toHaveText('target');
    await expect(editor.locator('span')).toHaveCSS('font-size', '22.5px');
    await expect(editor).toBeFocused();

    await size.click();
    await page.getByRole('option', { name: 'Default · 16', exact: true }).click();
    await expect(size).toHaveText('16');
    await expect(editor.locator('span')).toHaveCount(0);
    await expect(editor).toHaveText('Before target after');
});

test('document text size scales the whole document and preserves explicit font sizes', async ({
    page,
}) => {
    await page.goto('?scenario=typography-controls');
    const editor = await selectTarget(page);
    await page.getByRole('button', { name: 'Font size', exact: true }).click();
    await page.getByRole('option', { name: '18', exact: true }).click();

    await page.getByRole('button', { name: 'Document text size', exact: true }).click();
    const popover = page.locator('[data-slot="popover-content"]');
    await expect(popover.getByRole('button')).toHaveCount(5);
    await popover.getByRole('button', { name: 'Extra large', exact: true }).click();
    await expect(editor).toHaveCSS('font-size', '20px');
    await expect(editor.locator('span')).toHaveCSS('font-size', '18px');
    await expect(editor).toHaveText('Before target after');

    await page.getByRole('button', { name: 'Font size', exact: true }).click();
    await page.getByRole('option', { name: 'Default · 20', exact: true }).click();
    await expect(editor.locator('span')).toHaveCount(0);
    await expect(editor).toHaveCSS('font-size', '20px');
});
