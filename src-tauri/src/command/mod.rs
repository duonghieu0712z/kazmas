mod error;
mod menu;

use tauri_specta::{Commands, collect_commands};

pub(crate) fn commands() -> Commands<tauri::Wry> {
    collect_commands![menu::get_app_menu, menu::execute_menu_command]
}
