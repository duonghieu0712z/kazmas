import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { browser, $, expect } from '@wdio/globals';

import '@wdio/tauri-service';

async function openChapterA() {
    const entry = $('//*[@role="treeitem"][contains(., "Chapter A")]');
    await entry.waitForDisplayed();
    await entry.click();
    await $('.tiptap').waitForDisplayed();
}

async function expectDocumentText(expected: string) {
    await browser.waitUntil(
        async () =>
            (await browser.execute(() => document.querySelector('.tiptap')?.textContent)) ===
            expected,
        { timeout: 10000, timeoutMsg: `Expected document content: ${expected}` },
    );
    expect(await browser.execute(() => document.querySelector('.tiptap')?.textContent)).toBe(
        expected,
    );
}

describe('desktop world lifecycle with real SQLite and packages', () => {
    let name: string;
    let packagePath: string;

    beforeEach(async () => {
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
        await $('.tiptap').waitForDisplayed();
    });

    afterEach(async () => {
        const hasWorld = await browser.execute(() => Boolean(window.__kazmasDesktopTest.world()));
        if (hasWorld) {
            await browser.execute(() => window.__kazmasDesktopTest.save());
            await browser.execute(() => window.__kazmasDesktopTest.close());
        }
    });

    it('saves immediately after typing and reopens the same Unicode content', async () => {
        await $('.tiptap').setValue('Unicode \u65e5\u672c\u8a9e and formatted manuscript');
        await browser.execute(() => window.__kazmasDesktopTest.save());
        await browser.execute(() => window.__kazmasDesktopTest.close());
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await openChapterA();
        await expectDocumentText('Unicode \u65e5\u672c\u8a9e and formatted manuscript');
    });

    it('switches documents before debounce expires without losing the first edit', async () => {
        await $('.tiptap').setValue('Pending chapter A content');
        await browser.execute(() => window.__kazmasDesktopTest.entry('Chapter B'));
        await openChapterA();
        await expectDocumentText('Pending chapter A content');
    });

    it('save as preserves the original package and persists the edited copy', async () => {
        const original = await readFile(packagePath);
        await $('.tiptap').setValue('Copy content');
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
        await $('.tiptap').setValue('Discarded content');
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
        await $('.tiptap').waitForExist({ reverse: true });
        await browser.execute((path) => window.__kazmasDesktopTest.open(path), packagePath);
        await openChapterA();
        await expectDocumentText('');
    });

    it('save from the close dialog persists the current document', async () => {
        await $('.tiptap').setValue('Saved from dialog');
        await browser.execute(() => {
            void window.__kazmasDesktopTest.close();
        });
        await $('[role="alertdialog"]').waitForDisplayed();
        await $('button=Save').click();
        await $('.tiptap').waitForExist({ reverse: true });
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
        await expect($('.tiptap')).toBeDisplayed();
    });

    it('focuses an existing project instead of creating a duplicate window', async () => {
        await browser.execute(() => window.__kazmasDesktopTest.save());
        const owner = await browser.getWindowHandle();
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
            expect(await browser.getWindowHandles()).toEqual(handles);
            expect(await browser.execute(() => window.__kazmasDesktopTest.world())).toBeNull();
            await browser.switchToWindow(owner);
            expect(await browser.execute(() => window.__kazmasDesktopTest.world()?.name)).toBe(
                name,
            );
        } finally {
            await browser.switchToWindow(other);
            await browser.closeWindow();
            await browser.switchToWindow(owner);
        }
    });
});
