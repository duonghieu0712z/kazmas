use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::menu::HELP_SUBMENU_ID;
#[cfg(target_os = "macos")]
use tauri::menu::WINDOW_SUBMENU_ID;

use super::MenuCommand;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MenuSection {
    pub(super) id: String,
    pub(super) text: String,
    pub(super) items: Vec<MenuItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub(crate) enum MenuItem {
    #[cfg(target_os = "macos")]
    #[specta(skip)]
    Predefined {
        id: MenuCommand,
        text: Option<String>,
    },
    Item {
        id: MenuCommand,
        text: String,
        shortcut: Option<String>,
        enabled: bool,
    },
    Check {
        id: MenuCommand,
        text: String,
        shortcut: Option<String>,
        checked: bool,
        enabled: bool,
    },
    Submenu {
        id: MenuCommand,
        text: String,
        items: Vec<MenuItem>,
        enabled: bool,
    },
    Separator {
        id: String,
    },
}

pub(crate) fn menu_sections(app_name: &str) -> Vec<MenuSection> {
    vec![
        #[cfg(target_os = "macos")]
        MenuSection {
            id: "app".into(),
            text: app_name.into(),
            items: vec![
                item(MenuCommand::About, app_name),
                item(MenuCommand::Updates, app_name),
                separator("app-settings-separator"),
                item(MenuCommand::Settings, app_name),
                separator("app-services-separator"),
                predefined(MenuCommand::Services, app_name),
                separator("app-hide-separator"),
                predefined(MenuCommand::Hide, app_name),
                predefined(MenuCommand::HideOthers, app_name),
                predefined(MenuCommand::ShowAll, app_name),
                separator("app-quit-separator"),
                predefined(MenuCommand::Quit, app_name),
            ],
        },
        MenuSection {
            id: "file".into(),
            text: "File".into(),
            items: vec![
                item(MenuCommand::NewWorld, app_name),
                item(MenuCommand::NewWindow, app_name),
                separator("file-open-separator"),
                item(MenuCommand::OpenWorld, app_name),
                submenu(MenuCommand::RecentWorlds, app_name, vec![item(
                    MenuCommand::ClearWorlds,
                    app_name,
                )]),
                separator("file-save-separator"),
                item(MenuCommand::Save, app_name),
                item(MenuCommand::SaveAs, app_name),
                #[cfg(not(target_os = "macos"))]
                separator("file-settings-separator"),
                #[cfg(not(target_os = "macos"))]
                item(MenuCommand::Settings, app_name),
                separator("file-close-separator"),
                item(MenuCommand::CloseWorld, app_name),
                native(MenuCommand::CloseWindow, app_name),
                #[cfg(not(target_os = "macos"))]
                separator("file-quit-separator"),
                #[cfg(not(target_os = "macos"))]
                item(MenuCommand::Quit, app_name),
            ],
        },
        MenuSection {
            id: "edit".into(),
            text: "Edit".into(),
            items: vec![
                native(MenuCommand::Undo, app_name),
                native(MenuCommand::Redo, app_name),
                separator("edit-clipboard-separator"),
                native(MenuCommand::Cut, app_name),
                native(MenuCommand::Copy, app_name),
                native(MenuCommand::Paste, app_name),
                separator("edit-select-separator"),
                native(MenuCommand::SelectAll, app_name),
            ],
        },
        MenuSection {
            id: "project".into(),
            text: "Project".into(),
            items: vec![
                submenu(MenuCommand::NewFile, app_name, vec![
                    item(MenuCommand::NewChapter, app_name),
                    item(MenuCommand::NewWikiEntry, app_name),
                ]),
                item(MenuCommand::NewFolder, app_name),
                separator("project-settings-separator"),
                item(MenuCommand::ProjectSettings, app_name),
            ],
        },
        #[cfg(target_os = "macos")]
        MenuSection {
            id: WINDOW_SUBMENU_ID.into(),
            text: "Window".into(),
            items: vec![
                predefined(MenuCommand::Minimize, app_name),
                predefined(MenuCommand::Maximize, app_name),
                separator("window-fullscreen-separator"),
                predefined(MenuCommand::Fullscreen, app_name),
                separator("window-front-separator"),
                predefined(MenuCommand::BringAllToFront, app_name),
            ],
        },
        MenuSection {
            id: HELP_SUBMENU_ID.into(),
            text: "Help".into(),
            items: vec![
                #[cfg(not(target_os = "macos"))]
                item(MenuCommand::About, app_name),
                #[cfg(not(target_os = "macos"))]
                item(MenuCommand::Updates, app_name),
                #[cfg(not(target_os = "macos"))]
                separator("help-devtools-separator"),
                item(MenuCommand::ToggleDevtools, app_name),
            ],
        },
    ]
}

#[cfg(target_os = "macos")]
fn native(id: MenuCommand, app_name: &str) -> MenuItem {
    predefined(id, app_name)
}

#[cfg(not(target_os = "macos"))]
fn native(id: MenuCommand, app_name: &str) -> MenuItem {
    item(id, app_name)
}

#[cfg(target_os = "macos")]
fn predefined(id: MenuCommand, app_name: &str) -> MenuItem {
    MenuItem::Predefined {
        id,
        text: id.text(app_name),
    }
}

fn item(id: MenuCommand, app_name: &str) -> MenuItem {
    MenuItem::Item {
        id,
        text: text(id, app_name),
        shortcut: id.accelerator(),
        enabled: true,
    }
}

#[allow(dead_code)]
fn check(id: MenuCommand, app_name: &str, checked: bool) -> MenuItem {
    MenuItem::Check {
        id,
        text: text(id, app_name),
        shortcut: id.accelerator(),
        checked,
        enabled: true,
    }
}

fn submenu(id: MenuCommand, app_name: &str, items: Vec<MenuItem>) -> MenuItem {
    MenuItem::Submenu {
        id,
        text: text(id, app_name),
        items,
        enabled: true,
    }
}

fn text(id: MenuCommand, app_name: &str) -> String {
    id.text(app_name).unwrap_or_default()
}

fn separator(id: &'static str) -> MenuItem {
    MenuItem::Separator { id: id.into() }
}

pub(crate) fn set_command_enabled(
    menu_sections: &mut [MenuSection],
    command: MenuCommand,
    enabled: bool,
) {
    for section in menu_sections {
        set_item_enabled(&mut section.items, command, enabled);
    }
}

fn set_item_enabled(items: &mut [MenuItem], command: MenuCommand, enabled: bool) {
    for item in items {
        match item {
            MenuItem::Item {
                id,
                enabled: item_enabled,
                ..
            }
            | MenuItem::Check {
                id,
                enabled: item_enabled,
                ..
            } if *id == command => *item_enabled = enabled,
            MenuItem::Submenu {
                id,
                enabled: item_enabled,
                items,
                ..
            } => {
                if *id == command {
                    *item_enabled = enabled;
                }
                set_item_enabled(items, command, enabled);
            }
            _ => {}
        }
    }
}
