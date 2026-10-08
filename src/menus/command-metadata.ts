import type { MenuCommand as RustMenuCommand } from '@/generated/bindings';

import { getName } from '@tauri-apps/api/app';

const appName = await getName();

export type MenuCommandMetadata = {
    text: string;
    shortcut?: string;
};

const menuCommandMetadata: Record<RustMenuCommand, MenuCommandMetadata> = {
    about: { text: `About ${appName}` },
    'clear-worlds': { text: 'Clear Worlds...' },
    'close-world': { text: 'Close World', shortcut: 'mod+alt+w' },
    'close-window': { text: 'Close Window', shortcut: 'mod+w' },
    copy: { text: 'Copy', shortcut: 'mod+c' },
    cut: { text: 'Cut', shortcut: 'mod+x' },
    'empty-trash': { text: 'Empty Trash' },
    'new-manuscript-entry': { text: 'New Manuscript' },
    'new-file': { text: 'New File...' },
    'new-folder': { text: 'New Folder' },
    'new-window': { text: 'New Window...', shortcut: 'mod+shift+w' },
    'new-world': { text: 'New World...', shortcut: 'mod+shift+n' },
    'new-wiki-entry': { text: 'New Wiki' },
    'open-world': { text: 'Open World...', shortcut: 'mod+o' },
    paste: { text: 'Paste', shortcut: 'mod+v' },
    'project-settings': {
        text: 'Project Settings...',
        shortcut: 'mod+shift+,',
    },
    quit: { text: 'Exit' },
    redo: { text: 'Redo', shortcut: 'mod+shift+z' },
    'recent-worlds': { text: 'Recent Worlds' },
    'reload-window': { text: 'Reload Window', shortcut: 'mod+r' },
    save: { text: 'Save', shortcut: 'mod+s' },
    'save-as': { text: 'Save As...', shortcut: 'mod+shift+s' },
    settings: { text: 'Settings...', shortcut: 'mod+,' },
    'select-all': { text: 'Select All', shortcut: 'mod+a' },
    'toggle-devtools': { text: 'Toggle Developer Tools' },
    undo: { text: 'Undo', shortcut: 'mod+z' },
    updates: { text: 'Check for Updates...' },
};

export function getMenuCommandMetadata(command: RustMenuCommand) {
    return menuCommandMetadata[command];
}
