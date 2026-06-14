use serde::Serialize;
use specta::Type;

use super::MenuCommand;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MenuGroup {
    id: &'static str,
    text: &'static str,
    items: Vec<MenuItem>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub(crate) enum MenuItem {
    Item {
        id: MenuCommand,
        text: &'static str,
        shortcut: Option<&'static str>,
        disabled: bool,
    },
    Check {
        id: MenuCommand,
        text: &'static str,
        shortcut: Option<&'static str>,
        checked: bool,
        disabled: bool,
    },
    Submenu {
        id: &'static str,
        text: &'static str,
        items: Vec<MenuItem>,
    },
    Separator {
        id: &'static str,
    },
}

pub(crate) fn app_menu() -> Vec<MenuGroup> {
    vec![
        MenuGroup {
            id: "file",
            text: "File",
            items: vec![
                item(MenuCommand::NewFile),
                item(MenuCommand::NewWorld),
                item(MenuCommand::NewWindow),
                separator("file-open-separator"),
                item(MenuCommand::OpenWorld),
                item(MenuCommand::RecentWorlds),
                separator("file-save-separator"),
                item(MenuCommand::Save),
                item(MenuCommand::SaveAs),
                separator("file-settings-separator"),
                item(MenuCommand::Settings),
                separator("file-close-separator"),
                item(MenuCommand::CloseWorld),
                item(MenuCommand::CloseWindow),
                separator("file-quit-separator"),
                item(MenuCommand::Quit),
            ],
        },
        MenuGroup {
            id: "edit",
            text: "Edit",
            items: vec![
                item(MenuCommand::Undo),
                item(MenuCommand::Redo),
                separator("edit-clipboard-separator"),
                item(MenuCommand::Cut),
                item(MenuCommand::Copy),
                item(MenuCommand::Paste),
                separator("edit-select-separator"),
                item(MenuCommand::SelectAll),
            ],
        },
        MenuGroup {
            id: "help",
            text: "Help",
            items: vec![
                item(MenuCommand::Updates),
                separator("help-about-separator"),
                item(MenuCommand::About),
            ],
        },
    ]
}

fn item(id: MenuCommand) -> MenuItem {
    MenuItem::Item {
        id,
        text: id.text(),
        shortcut: id.accelerator(),
        disabled: false,
    }
}

#[allow(dead_code)]
fn check(id: MenuCommand, checked: bool) -> MenuItem {
    MenuItem::Check {
        id,
        text: id.text(),
        shortcut: id.accelerator(),
        checked,
        disabled: false,
    }
}

#[allow(dead_code)]
fn submenu(id: &'static str, text: &'static str, items: Vec<MenuItem>) -> MenuItem {
    MenuItem::Submenu { id, text, items }
}

fn separator(id: &'static str) -> MenuItem {
    MenuItem::Separator { id }
}
