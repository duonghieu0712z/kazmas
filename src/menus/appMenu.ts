import type { MenuCommand } from '@/generated/bindings';

export type AppMenuItem =
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
          items: AppMenuItem[];
          enabled: boolean;
      }
    | {
          type: 'separator';
          id: string;
      };

type AppMenuSection = {
    id: string;
    text: string;
    items: AppMenuItem[];
};

type AppMenuState = {
    hasProject: boolean;
};

export function appMenuSections({ hasProject }: AppMenuState): AppMenuSection[] {
    return [
        {
            id: 'file',
            text: 'File',
            items: [
                item('new-world', 'New World...', 'CmdOrCtrl+Shift+N'),
                item('new-window', 'New Window...', 'CmdOrCtrl+Shift+W'),
                separator('file-open-separator'),
                item('open-world', 'Open World...', 'CmdOrCtrl+O'),
                submenu('recent-worlds', 'Recent Worlds', [
                    item('clear-worlds', 'Clear Worlds...'),
                ]),
                separator('file-save-separator'),
                item('save', 'Save', 'CmdOrCtrl+S'),
                item('save-as', 'Save As...', 'CmdOrCtrl+Shift+S'),
                separator('file-settings-separator'),
                item('settings', 'Settings...', 'CmdOrCtrl+,'),
                separator('file-close-separator'),
                item('close-world', 'Close World', 'CmdOrCtrl+Alt+W'),
                item('close-window', 'Close Window', 'CmdOrCtrl+W'),
                separator('file-quit-separator'),
                item('quit', 'Exit'),
            ],
        },
        {
            id: 'edit',
            text: 'Edit',
            items: [
                item('undo', 'Undo', 'CmdOrCtrl+Z'),
                item('redo', 'Redo', 'CmdOrCtrl+Shift+Z'),
                separator('edit-clipboard-separator'),
                item('cut', 'Cut', 'CmdOrCtrl+X'),
                item('copy', 'Copy', 'CmdOrCtrl+C'),
                item('paste', 'Paste', 'CmdOrCtrl+V'),
                separator('edit-select-separator'),
                item('select-all', 'Select All', 'CmdOrCtrl+A'),
            ],
        },
        {
            id: 'project',
            text: 'Project',
            items: [
                submenu(
                    'new-file',
                    'New File...',
                    [
                        item('new-manuscript-entry', 'New Manuscript'),
                        item('new-wiki-entry', 'New Wiki'),
                    ],
                    hasProject,
                ),
                item('new-folder', 'New Folder', null, hasProject),
                separator('project-settings-separator'),
                item('project-settings', 'Project Settings...', 'CmdOrCtrl+Shift+,', hasProject),
                separator('project-trash-separator'),
                item('empty-trash', 'Empty Trash', null, hasProject),
            ],
        },
        {
            id: 'help',
            text: 'Help',
            items: [
                item('about', 'About Kazmas'),
                item('updates', 'Check for Updates...'),
                separator('help-devtools-separator'),
                item('toggle-devtools', 'Toggle Developer Tools'),
            ],
        },
    ];
}

function item(
    id: MenuCommand,
    text: string,
    shortcut: string | null = null,
    enabled = true,
): AppMenuItem {
    return {
        type: 'item',
        id,
        text,
        shortcut,
        enabled,
    };
}

function submenu(id: MenuCommand, text: string, items: AppMenuItem[], enabled = true): AppMenuItem {
    return {
        type: 'submenu',
        id,
        text,
        items,
        enabled,
    };
}

function separator(id: string): AppMenuItem {
    return {
        type: 'separator',
        id,
    };
}
