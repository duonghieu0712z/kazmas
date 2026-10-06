import { test, expect } from './fixtures';

test('code placeholder aligns with content', async ({ page, workspace }) => {
    await workspace.open();
    await page.locator('.tiptap').evaluate((element) => {
        const editor = (
            element as HTMLElement & {
                editor: {
                    commands: { setContent: (content: unknown) => void };
                };
            }
        ).editor;
        editor.commands.setContent({ type: 'doc', content: [{ type: 'codeBlock' }] });
    });
    const code = page.locator('.tiptap code').first();
    const result = await code.evaluate((element) => {
        const wrapper = element.closest('[data-node-view-wrapper]')!;
        const pseudo = getComputedStyle(wrapper, '::before');
        const content = getComputedStyle(element);
        return {
            content: pseudo.content,
            placeholder: wrapper.getAttribute('data-placeholder'),
            top: parseFloat(pseudo.top),
            left: parseFloat(pseudo.left),
            codeTop: element.getBoundingClientRect().top - wrapper.getBoundingClientRect().top,
            codeLeft: element.getBoundingClientRect().left - wrapper.getBoundingClientRect().left,
            fontFamily: [pseudo.fontFamily, content.fontFamily],
            fontSize: [pseudo.fontSize, content.fontSize],
            lineHeight: [pseudo.lineHeight, content.lineHeight],
        };
    });
    expect(result.placeholder).toBe('Write something...');
    expect(result.content).toBe(JSON.stringify(result.placeholder));
    expect(result.top).toBe(result.codeTop);
    expect(result.left).toBe(result.codeLeft);
    expect(result.fontFamily[0]).toBe(result.fontFamily[1]);
    expect(result.fontSize[0]).toBe(result.fontSize[1]);
    expect(result.lineHeight[0]).toBe(result.lineHeight[1]);
    await code.click();
    await page.keyboard.type('sample');
    await expect(code).toContainText('sample');
    expect(
        await code.evaluate(
            (element) =>
                getComputedStyle(element.closest('[data-node-view-wrapper]')!, '::before').content,
        ),
    ).toBe('""');
});
