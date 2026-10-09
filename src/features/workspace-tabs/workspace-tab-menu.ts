import type { WorkspaceTab } from '.';
import type { MenuActionItem, MenuItem } from '@/menus';

export type WorkspaceTabMenuActions = {
    close: (ids: readonly string[]) => Promise<void>;
    reveal: () => void;
};

export function createWorkspaceTabMenuItems(
    tabs: readonly WorkspaceTab[],
    tabId: string,
    canRevealInTree: boolean,
    canClose: boolean,
    actions: WorkspaceTabMenuActions,
): MenuItem[] {
    const index = tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) {
        return [];
    }
    const items: MenuItem[] = [
        item('close-tab', 'Close Tab', async () => await actions.close([tabId]), canClose),
        item(
            'close-other-tabs',
            'Close Other Tabs',
            async () =>
                await actions.close(tabs.filter((tab) => tab.id !== tabId).map((tab) => tab.id)),
            canClose && tabs.length > 1,
        ),
        item(
            'close-tabs-to-right',
            'Close Tabs to the Right',
            async () => await actions.close(tabs.slice(index + 1).map((tab) => tab.id)),
            canClose && index < tabs.length - 1,
        ),
        item(
            'close-all-tabs',
            'Close All Tabs',
            async () => await actions.close(tabs.map((tab) => tab.id)),
            canClose,
        ),
    ];
    if (canRevealInTree) {
        items.push(
            { type: 'separator', id: 'tab-reveal-separator' },
            item('reveal-in-tree', 'Reveal in Tree', actions.reveal),
        );
    }
    return items;
}

function item(
    id: string,
    text: string,
    execute: () => void | Promise<void>,
    enabled = true,
): MenuActionItem {
    return { type: 'item', id, text, enabled, command: { type: 'frontend', id, execute } };
}
