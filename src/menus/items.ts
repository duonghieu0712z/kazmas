import type { MenuActionItem, MenuItem, MenuItemIndex, MenuSection } from './types';
import type { MenuCommand as RustMenuCommand } from '@/generated/bindings';

import { getMenuCommandMetadata } from './command-metadata';

export function createCommandMenuItem(
    command: RustMenuCommand,
    overrides: Partial<Omit<MenuActionItem, 'type' | 'command'>> = {},
): MenuActionItem {
    const metadata = getMenuCommandMetadata(command);
    return {
        type: 'item',
        id: command,
        command,
        text: metadata.text,
        shortcut: metadata.shortcut,
        enabled: true,
        ...overrides,
    };
}

export function createMenuIndex(sections: readonly MenuSection[]): MenuItemIndex {
    const index: MenuItemIndex = new Map();
    const indexItems = (items: readonly MenuItem[]) => {
        for (const item of items) {
            if (item.type === 'separator' || item.type === 'label') {
                continue;
            }
            if (item.type === 'radio-group') {
                for (const option of item.items) {
                    index.set(option.id, option);
                }
                continue;
            }
            index.set(item.id, item);
            if (item.type === 'submenu') {
                indexItems(item.items);
            }
        }
    };
    for (const section of sections) {
        indexItems(section.items);
    }
    return index;
}
