import type { MenuCommand } from '@/generated/bindings';

import { getName } from '@tauri-apps/api/app';

const appName = await getName();

type MenuCommandMetadata = {
    text: string;
    shortcut?: string;
};

const menuCommandMetadata: Record<MenuCommand, MenuCommandMetadata> = {
    about: { text: `About ${appName}` },
    'clear-worlds': { text: 'Clear Worlds...' },
    'close-world': { text: 'Close World', shortcut: 'Ctrl+Alt+W' },
    'close-window': { text: 'Close Window', shortcut: 'Ctrl+W' },
    copy: { text: 'Copy', shortcut: 'Ctrl+C' },
    cut: { text: 'Cut', shortcut: 'Ctrl+X' },
    'empty-trash': { text: 'Empty Trash' },
    'new-manuscript-entry': { text: 'New Manuscript' },
    'new-file': { text: 'New File...' },
    'new-folder': { text: 'New Folder' },
    'new-window': { text: 'New Window...', shortcut: 'Ctrl+Shift+W' },
    'new-world': { text: 'New World...', shortcut: 'Ctrl+Shift+N' },
    'new-wiki-entry': { text: 'New Wiki' },
    'open-world': { text: 'Open World...', shortcut: 'Ctrl+O' },
    paste: { text: 'Paste', shortcut: 'Ctrl+V' },
    'project-settings': {
        text: 'Project Settings...',
        shortcut: 'Ctrl+Shift+,',
    },
    quit: { text: 'Exit' },
    redo: { text: 'Redo', shortcut: 'Ctrl+Shift+Z' },
    'recent-worlds': { text: 'Recent Worlds' },
    save: { text: 'Save', shortcut: 'Ctrl+S' },
    'save-as': { text: 'Save As...', shortcut: 'Ctrl+Shift+S' },
    settings: { text: 'Settings...', shortcut: 'Ctrl+,' },
    'select-all': { text: 'Select All', shortcut: 'Ctrl+A' },
    'toggle-devtools': { text: 'Toggle Developer Tools' },
    undo: { text: 'Undo', shortcut: 'Ctrl+Z' },
    updates: { text: 'Check for Updates...' },
};

export type MenuItem =
    | {
          type: 'item';
          id: MenuCommand;
          text: string;
          shortcut: string | null;
          enabled: boolean;
      }
    | {
          type: 'check';
          id: MenuCommand;
          text: string;
          shortcut: string | null;
          checked: boolean;
          enabled: boolean;
      }
    | {
          type: 'submenu';
          id: MenuCommand;
          text: string;
          items: MenuItem[];
          enabled: boolean;
      }
    | {
          type: 'separator';
          id: string;
      };

export type MenuSection = {
    id: string;
    text: string;
    items: MenuItem[];
};

export function createMenu(): MenuSection[] {
    return [
        {
            id: 'file',
            text: 'File',
            items: [
                item('new-world'),
                item('new-window'),
                separator('file-open-separator'),
                item('open-world'),
                submenu('recent-worlds', [item('clear-worlds')]),
                separator('file-save-separator'),
                item('save'),
                item('save-as'),
                separator('file-settings-separator'),
                item('settings'),
                separator('file-close-separator'),
                item('close-world'),
                item('close-window'),
                separator('file-quit-separator'),
                item('quit'),
            ],
        },
        {
            id: 'edit',
            text: 'Edit',
            items: [
                item('undo'),
                item('redo'),
                separator('edit-clipboard-separator'),
                item('cut'),
                item('copy'),
                item('paste'),
                separator('edit-select-separator'),
                item('select-all'),
            ],
        },
        {
            id: 'project',
            text: 'Project',
            items: [
                submenu('new-file', [item('new-manuscript-entry'), item('new-wiki-entry')]),
                item('new-folder'),
                separator('project-settings-separator'),
                item('project-settings'),
                separator('project-trash-separator'),
                item('empty-trash'),
            ],
        },
        {
            id: 'help',
            text: 'Help',
            items: [
                item('about'),
                item('updates'),
                separator('help-devtools-separator'),
                item('toggle-devtools'),
            ],
        },
    ];
}

export function setMenuItemEnabled(
    menu: readonly MenuSection[],
    id: MenuCommand,
    enabled: boolean,
): void {
    const menuItem = findMenuItemInSections(id, menu);

    if (menuItem && menuItem.type !== 'separator') {
        menuItem.enabled = enabled;
    }
}

function item(id: MenuCommand): MenuItem {
    return {
        type: 'item',
        id,
        text: menuCommandMetadata[id].text,
        shortcut: menuCommandMetadata[id].shortcut ?? null,
        enabled: true,
    };
}

function submenu(id: MenuCommand, items: MenuItem[]): MenuItem {
    return {
        type: 'submenu',
        id,
        text: menuCommandMetadata[id].text,
        items,
        enabled: true,
    };
}

function separator(id: string): MenuItem {
    return { type: 'separator', id };
}

function findMenuItemInSections(id: MenuCommand, sections: readonly MenuSection[]) {
    for (const section of sections) {
        const item = findMenuItem(id, section.items);

        if (item) {
            return item;
        }
    }

    return null;
}

function findMenuItem(id: MenuCommand, items: readonly MenuItem[]): MenuItem | null {
    for (const item of items) {
        if (item.type !== 'separator' && item.id === id) {
            return item;
        }

        if (item.type === 'submenu') {
            const child = findMenuItem(id, item.items);

            if (child) {
                return child;
            }
        }
    }

    return null;
}
