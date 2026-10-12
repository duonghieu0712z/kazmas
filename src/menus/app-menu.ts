import type { MenuItem, MenuSection } from './types';
import type { MenuCommand as RustMenuCommand } from '@/generated/bindings';

import { getMenuCommandMetadata } from './command-metadata';
import { createCommandMenuItem } from './items';

export function createMenu(): MenuSection[] {
    return [
        {
            id: 'file',
            text: 'File',
            items: [
                createCommandMenuItem('new-world'),
                createCommandMenuItem('new-window'),
                separator('file-open-separator'),
                createCommandMenuItem('open-world'),
                submenu('recent-worlds', [createCommandMenuItem('clear-worlds')]),
                separator('file-save-separator'),
                createCommandMenuItem('save'),
                createCommandMenuItem('save-as'),
                separator('file-settings-separator'),
                createCommandMenuItem('settings'),
                separator('file-close-separator'),
                createCommandMenuItem('close-world'),
                createCommandMenuItem('close-window'),
                separator('file-quit-separator'),
                createCommandMenuItem('quit'),
            ],
        },
        {
            id: 'edit',
            text: 'Edit',
            items: [
                createCommandMenuItem('undo'),
                createCommandMenuItem('redo'),
                separator('edit-clipboard-separator'),
                createCommandMenuItem('cut'),
                createCommandMenuItem('copy'),
                createCommandMenuItem('paste'),
                separator('edit-select-separator'),
                createCommandMenuItem('select-all'),
            ],
        },
        {
            id: 'project',
            text: 'Project',
            items: [
                submenu('new-file', [
                    createCommandMenuItem('new-manuscript-entry'),
                    createCommandMenuItem('new-wiki-entry'),
                ]),
                createCommandMenuItem('new-folder'),
                separator('project-settings-separator'),
                createCommandMenuItem('project-settings'),
                separator('project-trash-separator'),
                createCommandMenuItem('empty-trash'),
            ],
        },
        {
            id: 'help',
            text: 'Help',
            items: [
                createCommandMenuItem('about'),
                createCommandMenuItem('updates'),
                separator('help-devtools-separator'),
                createCommandMenuItem('reload-window'),
                createCommandMenuItem('toggle-devtools'),
            ],
        },
    ];
}

function submenu(id: RustMenuCommand, items: MenuItem[]): MenuItem {
    return { type: 'submenu', id, text: getMenuCommandMetadata(id).text, items, enabled: true };
}

function separator(id: string): MenuItem {
    return { type: 'separator', id };
}
