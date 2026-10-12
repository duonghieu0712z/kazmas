import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { browser, $, expect } from '@wdio/globals';

import '@wdio/tauri-service';

async function closeTestWindow(handle: string) {
    await browser.switchToWindow(handle);
    await browser.closeWindow();
    await browser.waitUntil(async () => !(await browser.getWindowHandles()).includes(handle), {
        timeoutMsg: `Window ${handle} did not close.`,
    });
}

async function openChapterA() {
    const entry = $('//*[@role="treeitem"][contains(., "Chapter A")]');
    await entry.waitForDisplayed();
    await entry.click();
    await $('[role="tabpanel"][data-state="active"] .tiptap').waitForDisplayed();
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
        await $('button[aria-label="Bold"]').click();
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
        await $('[role="tabpanel"][data-state="active"] .tiptap').setValue(
            'Nested chapter content',
        );

        await $('button[aria-label="New manuscript entry"]').click();
        await $('input[aria-label="New item name"]').setValue('Sibling chapter');
        await browser.keys('Enter');
        await expect(sibling).toHaveAttribute('aria-selected', 'true');
        await expect(sibling).toHaveAttribute('aria-level', '2');

        await browser.execute(() => window.__kazmasDesktopTest.save());
        await browser.execute(() => window.__kazmasDesktopTest.close());
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        const reopenedFolder = $('//*[@role="treeitem"][contains(., "New folder")]');
        await reopenedFolder.waitForDisplayed();
        if ((await reopenedFolder.getAttribute('aria-expanded')) !== 'true') {
            await reopenedFolder.$('.tree-chevron-icon').click();
        }
        const reopenedEntry = $('//*[@role="treeitem"][normalize-space(.)="New chapter"]');
        const reopenedSibling = $('//*[@role="treeitem"][normalize-space(.)="Sibling chapter"]');
        await expect(reopenedEntry).toHaveAttribute('aria-level', '2');
        await expect(reopenedSibling).toHaveAttribute('aria-level', '2');
        await reopenedEntry.click();
        await expectDocumentText('Nested chapter content');
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
