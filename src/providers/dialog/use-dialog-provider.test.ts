import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import { useDialogProvider } from './use-dialog-provider';

const TestDialog = defineComponent({ render: () => null });

function createButton() {
    const button = document.createElement('button');
    document.body.append(button);
    return button;
}

afterEach(() => useDialogProvider().closeDialog());

describe('dialog focus restoration', () => {
    it('preserves the original opener when an active dialog is replaced', async () => {
        const provider = useDialogProvider();
        const opener = createButton();
        const fallback = createButton();
        fallback.dataset.slot = 'menubar-trigger';
        fallback.tabIndex = 0;
        opener.focus();
        const first = provider.openDialog({ component: TestDialog });
        const control = createButton();
        control.focus();
        const replacement = provider.openDialog({ component: TestDialog });
        control.remove();
        await expect(first).resolves.toBeNull();
        provider.closeDialog();
        await expect(replacement).resolves.toBeNull();
        const event = new Event('closeAutoFocus', { cancelable: true });
        provider.restoreFocus(event);
        expect(document.activeElement).toBe(opener);
        expect(event.defaultPrevented).toBe(true);
    });

    it('captures a new opener after the previous dialog is closed', async () => {
        const provider = useDialogProvider();
        const original = createButton();
        original.focus();
        const first = provider.openDialog({ component: TestDialog });
        provider.closeDialog();
        await first;
        const opener = createButton();
        opener.focus();
        const next = provider.openDialog({ component: TestDialog });
        const control = createButton();
        control.focus();
        provider.closeDialog();
        control.remove();
        await next;
        provider.restoreFocus(new Event('closeAutoFocus', { cancelable: true }));
        expect(document.activeElement).toBe(opener);
    });
});
