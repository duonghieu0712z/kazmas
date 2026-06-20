use serde::Serialize;
use specta::Type;
use tauri::menu::HELP_SUBMENU_ID;
#[cfg(target_os = "macos")]
use tauri::menu::WINDOW_SUBMENU_ID;

use super::MenuCommand;

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MenuSection {
    pub(super) id: &'static str,
    pub(super) text: String,
    pub(super) items: Vec<MenuItem>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub(crate) enum MenuItem {
    Item {
        id: MenuCommand,
        text: String,
        shortcut: Option<&'static str>,
        enabled: bool,
    },
    Check {
        id: MenuCommand,
        text: String,
        shortcut: Option<&'static str>,
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
        id: &'static str,
    },
}

pub(crate) fn menu_sections(app_name: &str) -> Vec<MenuSection> {
    vec![
        #[cfg(target_os = "macos")]
        MenuSection {
            id: "app",
            text: app_name.into(),
            items: vec![
                item(MenuCommand::About, app_name),
                item(MenuCommand::Updates, app_name),
                separator("app-settings-separator"),
                item(MenuCommand::Settings, app_name),
                separator("app-services-separator"),
                item(MenuCommand::Services, app_name),
                separator("app-hide-separator"),
                item(MenuCommand::Hide, app_name),
                item(MenuCommand::HideOthers, app_name),
                item(MenuCommand::ShowAll, app_name),
                separator("app-quit-separator"),
                item(MenuCommand::Quit, app_name),
            ],
        },
        MenuSection {
            id: "file",
            text: "File".into(),
            items: vec![
                item(MenuCommand::NewFile, app_name),
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
                item(MenuCommand::CloseWindow, app_name),
                #[cfg(not(target_os = "macos"))]
                separator("file-quit-separator"),
                #[cfg(not(target_os = "macos"))]
                item(MenuCommand::Quit, app_name),
            ],
        },
        MenuSection {
            id: "edit",
            text: "Edit".into(),
            items: vec![
                item(MenuCommand::Undo, app_name),
                item(MenuCommand::Redo, app_name),
                separator("edit-clipboard-separator"),
                item(MenuCommand::Cut, app_name),
                item(MenuCommand::Copy, app_name),
                item(MenuCommand::Paste, app_name),
                separator("edit-select-separator"),
                item(MenuCommand::SelectAll, app_name),
            ],
        },
        #[cfg(target_os = "macos")]
        MenuSection {
            id: WINDOW_SUBMENU_ID,
            text: "Window".into(),
            items: vec![
                item(MenuCommand::Minimize, app_name),
                item(MenuCommand::Maximize, app_name),
                separator("window-fullscreen-separator"),
                item(MenuCommand::Fullscreen, app_name),
                separator("window-front-separator"),
                item(MenuCommand::BringAllToFront, app_name),
            ],
        },
        MenuSection {
            id: HELP_SUBMENU_ID,
            text: "Help".into(),
            items: vec![
                #[cfg(not(target_os = "macos"))]
                item(MenuCommand::Updates, app_name),
                #[cfg(not(target_os = "macos"))]
                separator("help-about-separator"),
                #[cfg(not(target_os = "macos"))]
                item(MenuCommand::About, app_name),
            ],
        },
    ]
}

fn item(id: MenuCommand, app_name: &str) -> MenuItem {
    MenuItem::Item {
        id,
        text: id.text(app_name),
        shortcut: id.accelerator(),
        enabled: true,
    }
}

#[allow(dead_code)]
fn check(id: MenuCommand, checked: bool, app_name: &str) -> MenuItem {
    MenuItem::Check {
        id,
        text: id.text(app_name),
        shortcut: id.accelerator(),
        checked,
        enabled: true,
    }
}

#[allow(dead_code)]
fn submenu(id: MenuCommand, app_name: &str, items: Vec<MenuItem>) -> MenuItem {
    MenuItem::Submenu {
        id,
        text: id.text(app_name),
        items,
        enabled: true,
    }
}

fn separator(id: &'static str) -> MenuItem {
    MenuItem::Separator { id }
}
