import { expect, test } from './fixtures';

for (const theme of ['light', 'dark'] as const) {
    test(`editor highlight text and border remain readable in ${theme} mode`, async ({
        page,
        workspace,
    }) => {
        await page.addInitScript(
            (value) => localStorage.setItem('vueuse-color-scheme', value),
            theme,
        );
        await workspace.open();
        const ratios = await page.locator('.tiptap').evaluate((editor) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const context = canvas.getContext('2d')!;
            const luminance = (color: string, backdrop?: string) => {
                context.clearRect(0, 0, 1, 1);
                if (backdrop) {
                    context.fillStyle = backdrop;
                    context.fillRect(0, 0, 1, 1);
                }
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);
                const channels = [...context.getImageData(0, 0, 1, 1).data]
                    .slice(0, 3)
                    .map((value) => {
                        const channel = value / 255;
                        return channel <= 0.04045
                            ? channel / 12.92
                            : ((channel + 0.055) / 1.055) ** 2.4;
                    });
                return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
            };
            const contrast = (first: number, second: number) =>
                (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
            const background = getComputedStyle(editor).backgroundColor;
            const probe = document.createElement('span');
            editor.append(probe);
            const textRatios = [
                '',
                'find-and-replace-result',
                'find-and-replace-result-current',
            ].map((className) => {
                probe.className = className;
                probe.style.color = className ? '' : 'var(--highlight-foreground)';
                probe.style.backgroundColor = className ? '' : 'var(--highlight)';
                return contrast(
                    luminance(getComputedStyle(probe).color),
                    luminance(getComputedStyle(probe).backgroundColor, background),
                );
            });
            probe.className = '';
            probe.style.backgroundColor = 'var(--highlight-border)';
            const borderRatio = contrast(
                luminance(getComputedStyle(probe).backgroundColor),
                luminance(background),
            );
            probe.remove();
            return { textRatios, borderRatio };
        });
        for (const ratio of ratios.textRatios) {
            expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
        expect(ratios.borderRatio).toBeGreaterThanOrEqual(3);
    });
}

for (const theme of ['light', 'dark'] as const) {
    test(`dialog overlay uses the ${theme} palette`, async ({ page, workspace }) => {
        await page.addInitScript(
            (value) => localStorage.setItem('vueuse-color-scheme', value),
            theme,
        );
        await workspace.open('dialog');
        const overlay = page.locator('[data-slot="dialog-overlay"]');
        await expect(overlay).toBeVisible();
        const pixel = await overlay.evaluate((element) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const context = canvas.getContext('2d')!;
            context.fillStyle = getComputedStyle(element).backgroundColor;
            context.fillRect(0, 0, 1, 1);
            return [...context.getImageData(0, 0, 1, 1).data];
        });
        expect(pixel[0]).toBeGreaterThan(0);
        expect(pixel[0]).toBe(pixel[1]);
        expect(pixel[1]).toBe(pixel[2]);
        expect(pixel[3]).toBeCloseTo(255 * (theme === 'light' ? 0.6 : 0.8), 0);
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(overlay).toBeHidden();
    });
}
