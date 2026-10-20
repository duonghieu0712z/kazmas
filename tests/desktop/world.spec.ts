import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { browser, $, $$, expect } from '@wdio/globals';

import { getToolbarNavigationState } from '../support/toolbar';

import '@wdio/tauri-service';

function activityButton(name: string) {
    return $(`//button[@data-slot="sidebar-menu-button"][normalize-space(.)="${name}"]`);
}

async function closeTestWindow(handle: string) {
    await browser.switchToWindow(handle);
    await browser.closeWindow();
    await browser.waitUntil(async () => !(await browser.getWindowHandles()).includes(handle), {
        timeoutMsg: `Window ${handle} did not close.`,
    });
}

async function openChapterA() {
    await clickTreeItem('Chapter A');
    await waitForDocumentEditor('Chapter A');
}

async function clickTreeItem(name: string) {
    await $(`//*[@role="treeitem"][normalize-space(.)="${name}"]`).waitForClickable();

    await browser.execute((title) => {
        const item = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]')).find(
            (element) => element.textContent?.trim() === title,
        );
        if (!item) {
            throw new Error(`Tree item ${title} is unavailable.`);
        }

        const rect = item.getBoundingClientRect();
        const x = Math.floor(rect.left + rect.width / 2);
        const y = Math.floor(rect.top + rect.height / 2);
        const target = document.elementFromPoint(x, y);
        if (!target || !item.contains(target)) {
            throw new Error(`Tree item ${title} is not at its visible click position.`);
        }

        item.click();
    }, name);
}

async function clickToolbarControl(name: string) {
    let state = await browser.execute(getToolbarNavigationState, name);
    const maxSteps = state.controlCount * 2;

    for (let index = 0; index < maxSteps; index++) {
        if (state.direction === null) {
            await clickToolbarButton(name);
            return;
        }

        const previousLeft = state.scrollLeft;

        await clickToolbarButton(`${state.direction} toolbar controls`);
        await browser.waitUntil(
            async () => {
                state = await browser.execute(getToolbarNavigationState, name);
                return state.scrollLeft !== previousLeft || state.direction === null;
            },
            { timeoutMsg: `Toolbar did not move toward ${name}.` },
        );
    }

    throw new Error(`Toolbar control ${name} could not be reached.`);
}

async function clickToolbarButton(name: string) {
    const point = await browser.waitUntil(
        async () => {
            return await browser.execute((label) => {
                const toolbar = document.querySelector(
                    '[role="tabpanel"][data-state="active"] [data-slot="toolbar"]',
                );
                const button = Array.from(toolbar?.querySelectorAll('button') ?? []).find(
                    (element) => element.getAttribute('aria-label') === label,
                );
                if (!button || button.disabled) {
                    return null;
                }

                const rect = button.getBoundingClientRect();
                const x = Math.floor(rect.left + rect.width / 2);
                const y = Math.floor(rect.top + rect.height / 2);
                const target = document.elementFromPoint(x, y);
                if (!target || !button.contains(target)) {
                    return null;
                }

                return { x, y };
            }, name);
        },
        { timeoutMsg: `Toolbar button ${name} is not at its visible click position.` },
    );

    await browser
        .action('pointer')
        .move({ ...point, origin: 'viewport', duration: 0 })
        .down({ button: 0 })
        .up({ button: 0 })
        .perform();
}

async function waitForDocumentEditor(title: string) {
    const tab = $(`//*[@role="tab"][normalize-space(.)="${title}"]`);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    const panelId = await tab.getAttribute('aria-controls');
    if (!panelId) {
        throw new Error(`Document tab ${title} has no associated panel.`);
    }
    const editor = $(
        `[role="tabpanel"][id="${panelId}"][data-state="active"] .tiptap[contenteditable="true"]`,
    );
    await editor.waitForDisplayed();
    return editor;
}

async function expectDocumentText(expected: string) {
    await browser.waitUntil(
        async () =>
            (await browser.execute(
                () =>
                    document.querySelector('[role="tabpanel"][data-state="active"] .tiptap')
                        ?.textContent,
            )) === expected,
        { timeout: 10000, timeoutMsg: `Expected document content: ${expected}` },
    );
    expect(
        await browser.execute(
            () =>
                document.querySelector('[role="tabpanel"][data-state="active"] .tiptap')
                    ?.textContent,
        ),
    ).toBe(expected);
}

describe('desktop world lifecycle with real SQLite and packages', () => {
    let name: string;
    let packagePath: string;
    let owner: string;

    beforeEach(async () => {
        owner = await browser.getWindowHandle();
        await browser.waitUntil(() => browser.execute(() => Boolean(window.__kazmasDesktopTest)), {
            timeout: 30000,
        });
        const manuscript = activityButton('Manuscript');
        if ((await manuscript.getAttribute('data-active')) !== 'true') {
            await manuscript.click();
        }
        name = `World-${randomUUID()}`;
        const directory = process.env.KAZMAS_TEST_DATA_DIR;
        if (!directory) {
            throw new Error('Test directory is not configured.');
        }
        packagePath = resolve(directory, `${name}.kazmas`);
        await browser.execute(
            (worldName, path) => window.__kazmasDesktopTest.create(worldName, path),
            name,
            directory,
        );
        await browser.execute(() => window.__kazmasDesktopTest.entry('Chapter A'));
        await $('[role="tabpanel"][data-state="active"] .tiptap').waitForDisplayed();
    });

    afterEach(async () => {
        const errors: unknown[] = [];
        const handles = await browser.getWindowHandles();
        for (const handle of handles.filter((handle) => handle !== owner)) {
            try {
                await closeTestWindow(handle);
            } catch (error) {
                errors.push(error);
            }
        }
        try {
            await browser.switchToWindow(owner);
            await browser.execute(() => window.__kazmasDesktopTest.reset());
        } catch (error) {
            errors.push(error);
        }
        if (errors.length) {
            const details = errors
                .map((error) =>
                    error instanceof Error ? (error.stack ?? error.message) : String(error),
                )
                .join('\n');
            throw new AggregateError(errors, `Desktop test cleanup failed.\n${details}`);
        }
    });

    it('saves immediately after typing and reopens the same Unicode content', async () => {
        await $('[role="tabpanel"][data-state="active"] .tiptap').setValue(
            'Unicode \u65e5\u672c\u8a9e and formatted manuscript',
        );
        await browser.execute(() => window.__kazmasDesktopTest.save());
        await browser.execute(() => window.__kazmasDesktopTest.close());
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await openChapterA();
        await expectDocumentText('Unicode \u65e5\u672c\u8a9e and formatted manuscript');
    });

    it('saves formatted content through application controls', async () => {
        await $('[role="tabpanel"][data-state="active"] .tiptap').setValue('Formatted manuscript');
        await $('[role="tabpanel"][data-state="active"] .tiptap').click();
        await browser.keys(process.platform === 'darwin' ? ['Meta', 'a'] : ['Control', 'a']);
        await clickToolbarControl('Bold');
        await expect($('[role="tabpanel"][data-state="active"] .tiptap strong')).toHaveText(
            'Formatted manuscript',
        );
        if (process.platform === 'darwin') {
            await browser.execute(() => {
                void window.__kazmasDesktopTest.close();
            });
            await $('[role="alertdialog"]').waitForDisplayed();
            await $('button=Save').click();
            await $('[role="tabpanel"][data-state="active"] .tiptap').waitForExist({
                reverse: true,
            });
        } else {
            await $('//*[@role="menuitem"][normalize-space(.)="File"]').click();
            await browser.keys('ArrowDown');
            await $(
                '//*[@role="menuitem"][contains(., "Save") and not(contains(., "Save As"))]',
            ).click();
        }
        await browser.waitUntil(async () => {
            const saved = await readFile(packagePath);
            return (
                saved.length > 0 &&
                !(await browser.execute(() => window.__kazmasDesktopTest.isDirty()))
            );
        });
        if (process.platform !== 'darwin') {
            await browser.execute(() => window.__kazmasDesktopTest.close());
        }
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await openChapterA();
        await expect($('[role="tabpanel"][data-state="active"] .tiptap strong')).toHaveText(
            'Formatted manuscript',
        );
    });

    it('clicks visible formatting controls without scrolling their toolbar group', async () => {
        const size = await browser.getWindowSize();

        try {
            await browser.setWindowSize(1200, 800);
            const editor = $('[role="tabpanel"][data-state="active"] .tiptap');
            await editor.setValue('Visible toolbar controls');
            await editor.click();
            await browser.keys(process.platform === 'darwin' ? ['Meta', 'a'] : ['Control', 'a']);

            const before = await browser.execute(getToolbarNavigationState, 'Highlight');
            expect(before.direction).toBeNull();

            await clickToolbarControl('Highlight');

            const after = await browser.execute(getToolbarNavigationState, 'Text color');
            expect(after.scrollLeft).toBe(before.scrollLeft);
            expect(after.direction).toBeNull();

            await clickToolbarControl('Text color');
            await expect($('[role="dialog"][aria-label="Text color"]')).toBeDisplayed();
            await browser.keys('Escape');
        } finally {
            await browser.setWindowSize(size.width, size.height);
        }
    });

    it('reaches earlier toolbar controls across narrow and wide windows', async () => {
        const size = await browser.getWindowSize();

        try {
            for (const width of [640, 960, 1200]) {
                await browser.setWindowSize(width, 800);
                const editor = $('[role="tabpanel"][data-state="active"] .tiptap');
                await editor.setValue('Toolbar navigation');
                await editor.click();
                await browser.keys(
                    process.platform === 'darwin' ? ['Meta', 'a'] : ['Control', 'a'],
                );
                await clickToolbarControl('Highlight');
                await clickToolbarControl('Text color');
                await expect($('[role="dialog"][aria-label="Text color"]')).toBeDisplayed();
                await browser.keys('Escape');
                await clickToolbarControl('Line height');
                await browser.keys('Escape');
                await clickToolbarControl('Text color');
                await expect($('[role="dialog"][aria-label="Text color"]')).toBeDisplayed();
                await browser.keys('Escape');
            }
        } finally {
            await browser.setWindowSize(size.width, size.height);
        }
    });

    it('saves system fonts, highlight colors, and line height through a real package reopen', async () => {
        const editor = $('[role="tabpanel"][data-state="active"] .tiptap');
        await editor.setValue('Persisted typography and colors');
        await editor.click();
        await browser.keys(process.platform === 'darwin' ? ['Meta', 'a'] : ['Control', 'a']);

        await clickToolbarControl('Font family');
        await browser.waitUntil(async () => (await $$('[role="option"]')).length > 1);
        const fontOption = (await $$('[role="option"]'))[1]!;
        const family = await fontOption.getText();
        expect(family.trim().length).toBeGreaterThan(0);
        await fontOption.click();

        await clickToolbarControl('Highlight');
        await clickToolbarControl('Text color');
        await $(
            '[data-slot="popover-content"][data-state="open"] input[aria-label="Hex color"]',
        ).setValue('#123456');
        await $('[data-slot="popover-content"][data-state="open"]').$('button=Apply').click();
        await $('[role="dialog"][aria-label="Text color"]').waitForExist({ reverse: true });
        await clickToolbarControl('Text background color');
        await $(
            '[data-slot="popover-content"][data-state="open"] input[aria-label="Hex color"]',
        ).setValue('#abcdef');
        await $('[data-slot="popover-content"][data-state="open"]').$('button=Apply').click();
        await $('[role="dialog"][aria-label="Text background color"]').waitForExist({
            reverse: true,
        });

        await clickToolbarControl('Line height');
        await $(
            '[data-slot="popover-content"][data-state="open"] button[aria-label="1.5"]',
        ).click();

        await browser.execute(() => window.__kazmasDesktopTest.save());
        await browser.execute(() => window.__kazmasDesktopTest.close());
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await openChapterA();

        await expectDocumentText('Persisted typography and colors');
        const mark = $('[role="tabpanel"][data-state="active"] .tiptap mark');
        await expect(mark).toHaveAttribute('data-text-color', '#123456');
        await expect(mark).toHaveAttribute('data-color', '#abcdef');
        const typography = await browser.execute(() => {
            const element = document.querySelector<HTMLElement>(
                '[role="tabpanel"][data-state="active"] .tiptap span[style*="font-family"]',
            );
            return {
                family: element?.style.fontFamily.replace(/["']/g, ''),
                lineHeight: element?.style.lineHeight,
            };
        });
        expect(typography.family).toBe(family);
        expect(typography.lineHeight).toBe('1.5');
    });

    it('switches documents before debounce expires without losing the first edit', async () => {
        await $('[role="tabpanel"][data-state="active"] .tiptap').setValue(
            'Pending chapter A content',
        );
        await browser.execute(() => window.__kazmasDesktopTest.entry('Chapter B'));
        await openChapterA();
        await expectDocumentText('Pending chapter A content');
    });

    it('creates nested sidebar items and preserves their parents after reopening', async () => {
        const folder = $('//*[@role="treeitem"][contains(., "New folder")]');
        const entry = $('//*[@role="treeitem"][normalize-space(.)="New chapter"]');
        const sibling = $('//*[@role="treeitem"][normalize-space(.)="Sibling chapter"]');

        await $(
            '//*[@data-slot="sidebar-header"][.//span[text()="Manuscript"]]//button[@aria-label="New folder"]',
        ).click();
        await $('input[aria-label="New item name"]').setValue('  New folder  ');
        await browser.keys('Enter');
        await expect(folder).toHaveAttribute('aria-selected', 'true');
        await expect(folder).toHaveAttribute('aria-level', '1');

        await $('button[aria-label="New manuscript entry"]').click();
        await $('input[aria-label="New item name"]').setValue('  New chapter  ');
        await browser.keys('Enter');
        await expect(entry).toHaveAttribute('aria-selected', 'true');
        await expect(entry).toHaveAttribute('aria-level', '2');
        const editor = await waitForDocumentEditor('New chapter');
        await editor.click();
        await expect(editor).toBeFocused();
        await editor.setValue('Nested chapter content');
        await expectDocumentText('Nested chapter content');

        await $('button[aria-label="New manuscript entry"]').click();
        await $('input[aria-label="New item name"]').setValue('Sibling chapter');
        await browser.keys('Enter');
        await expect(sibling).toHaveAttribute('aria-selected', 'true');
        await expect(sibling).toHaveAttribute('aria-level', '2');
        await waitForDocumentEditor('Sibling chapter');

        for (let cycle = 0; cycle < 3; cycle++) {
            await $('//*[@role="tab"][normalize-space(.)="Sibling chapter"]').click();
            await browser.execute(() => window.__kazmasDesktopTest.save());
            await browser.execute(() => window.__kazmasDesktopTest.close());
            await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
            const reopenedFolder = $('//*[@role="treeitem"][contains(., "New folder")]');
            await reopenedFolder.waitForDisplayed();
            if ((await reopenedFolder.getAttribute('aria-expanded')) !== 'true') {
                await reopenedFolder.$('.tree-chevron-icon').click();
            }
            const reopenedEntry = $('//*[@role="treeitem"][normalize-space(.)="New chapter"]');
            const reopenedSibling = $(
                '//*[@role="treeitem"][normalize-space(.)="Sibling chapter"]',
            );
            await expect(reopenedEntry).toHaveAttribute('aria-level', '2');
            await expect(reopenedSibling).toHaveAttribute('aria-level', '2');
            await waitForDocumentEditor('Sibling chapter');
            await clickTreeItem('New chapter');
            await waitForDocumentEditor('New chapter');
            await expectDocumentText('Nested chapter content');
        }
    });

    it('groups trashed empty folders by source after saving and reopening', async () => {
        for (const section of ['Manuscript', 'Wiki']) {
            const activity = activityButton(section);
            if ((await activity.getAttribute('data-active')) !== 'true') {
                await activity.click();
            }
            await $(
                `//*[@data-slot="sidebar-header"][.//span[text()="${section}"]]//button[@aria-label="New folder"]`,
            ).click();
            const folderName = `Discarded ${section}`;
            await $('input[aria-label="New item name"]').setValue(folderName);
            await browser.keys('Enter');
            const folder = $(
                `//*[@data-node-tree="${section}"]//*[@role="treeitem"][normalize-space(.)="${folderName}"]`,
            );
            await folder.waitForDisplayed();
            await browser.execute((name) => {
                const item = Array.from(document.querySelectorAll('[role="treeitem"]')).find(
                    (element) => element.textContent?.trim() === name,
                );
                item?.dispatchEvent(
                    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }),
                );
            }, folderName);
            await $('//*[@role="menuitem"][normalize-space(.)="Move to Trash"]').click();
            await folder.waitForExist({ reverse: true });
        }
        await browser.execute(() => window.__kazmasDesktopTest.save());
        await browser.execute(() => window.__kazmasDesktopTest.close());
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await activityButton('Trash').click();
        for (const section of ['Manuscript', 'Wiki']) {
            const group = $(
                `[role="region"][aria-label="Trash"] [role="group"][aria-label="${section}"]`,
            );
            await group.waitForDisplayed();
            await expect(group.$('[data-slot="sidebar-group-label"]')).toHaveText(section);
            const folder = $(`[role="treeitem"][aria-label="Discarded ${section}"]`);
            await expect(folder).toHaveAttribute('aria-level', '1');
            await browser.execute((name) => {
                const item = document.querySelector(
                    `[role="region"][aria-label="Trash"] [role="treeitem"][aria-label="Discarded ${name}"]`,
                );
                item?.querySelector('[data-slot="tooltip-trigger"]')?.dispatchEvent(
                    new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }),
                );
            }, section);
            const tooltip = $(
                `//*[@data-slot="tooltip-content"][p[normalize-space(.)="Original location: ${section}"]]`,
            );
            await tooltip.waitForDisplayed();
            await expect(tooltip).toHaveText(
                expect.stringContaining(`Original location: ${section}`),
            );
        }
        await $('button[aria-label="Restore All"]').click();
        await browser.waitUntil(() =>
            browser.execute(
                () =>
                    document.querySelectorAll(
                        '[role="region"][aria-label="Trash"] [role="treeitem"]',
                    ).length === 0,
            ),
        );
        await expect($('button[aria-label="Restore All"]')).toBeDisabled();
        await expect($('button[aria-label="Empty Trash"]')).toBeDisabled();
        for (const section of ['Manuscript', 'Wiki']) {
            await activityButton(section).click();
            await expect(
                $(`//*[@role="treeitem"][normalize-space(.)="Discarded ${section}"]`),
            ).toBeDisplayed();
        }
    });

    it('save as preserves the original package and persists the edited copy', async () => {
        const original = await readFile(packagePath);
        await $('[role="tabpanel"][data-state="active"] .tiptap').setValue('Copy content');
        const copy = packagePath.replace('.kazmas', '-copy.kazmas');
        await browser.execute((path) => window.__kazmasDesktopTest.saveAs(path), copy);
        expect(await readFile(packagePath)).toEqual(original);
        await browser.execute(() => window.__kazmasDesktopTest.close());
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), copy);
        await openChapterA();
        await expectDocumentText('Copy content');
    });

    it('cancel keeps the world open and discard reopens the last saved content', async () => {
        await browser.execute(() => window.__kazmasDesktopTest.save());
        await $('[role="tabpanel"][data-state="active"] .tiptap').setValue('Discarded content');
        await browser.execute(() => {
            void window.__kazmasDesktopTest.close();
        });
        await $('[role="alertdialog"]').waitForDisplayed();
        await $('button=Cancel').click();
        await expectDocumentText('Discarded content');
        await browser.execute(() => {
            void window.__kazmasDesktopTest.close();
        });
        await $('[role="alertdialog"]').waitForDisplayed();
        await $("button=Don't Save").click();
        await $('[role="tabpanel"][data-state="active"] .tiptap').waitForExist({ reverse: true });
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await openChapterA();
        await expectDocumentText('');
    });

    it('save from the close dialog persists the current document', async () => {
        await $('[role="tabpanel"][data-state="active"] .tiptap').setValue('Saved from dialog');
        await browser.execute(() => {
            void window.__kazmasDesktopTest.close();
        });
        await $('[role="alertdialog"]').waitForDisplayed();
        await $('button=Save').click();
        await $('[role="tabpanel"][data-state="active"] .tiptap').waitForExist({ reverse: true });
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await openChapterA();
        await expectDocumentText('Saved from dialog');
    });

    it('rejects corrupt packages without replacing the open world', async () => {
        const corrupt = packagePath.replace('.kazmas', '-corrupt.kazmas');
        await writeFile(corrupt, 'invalid package');
        await expect(
            browser.execute((path) => window.__kazmasDesktopTest.open(path), corrupt),
        ).rejects.toThrow();
        expect(await browser.execute(() => window.__kazmasDesktopTest.world()?.name)).toBe(name);
        await expect($('[role="tabpanel"][data-state="active"] .tiptap')).toBeDisplayed();
    });

    it('keeps the existing project owner without creating a duplicate window', async () => {
        await browser.execute(() => window.__kazmasDesktopTest.save());
        const before = await browser.getWindowHandles();
        await browser.execute(() => window.__kazmasDesktopTest.newWindow());
        await browser.waitUntil(
            async () => (await browser.getWindowHandles()).length === before.length + 1,
        );
        const handles = await browser.getWindowHandles();
        const other = handles.find((handle) => !before.includes(handle));
        if (!other) {
            throw new Error('The second window was not created.');
        }
        try {
            await browser.switchToWindow(other);
            await browser.waitUntil(() =>
                browser.execute(() => Boolean(window.__kazmasDesktopTest)),
            );
            expect(await browser.execute(() => window.__kazmasDesktopTest.world())).toBeNull();
            await browser.execute(
                (path) => window.__kazmasDesktopTest.open(path, true),
                packagePath,
            );
            expect((await browser.getWindowHandles()).sort()).toEqual([...handles].sort());
            expect(await browser.execute(() => window.__kazmasDesktopTest.world())).toBeNull();
            await browser.switchToWindow(owner);
            expect(await browser.execute(() => window.__kazmasDesktopTest.world()?.name)).toBe(
                name,
            );
        } finally {
            await closeTestWindow(other);
            await browser.switchToWindow(owner);
        }
    });
});
