mod error;
mod menu;
mod world;

use tauri_specta::{Commands, collect_commands};

pub(crate) fn commands() -> Commands<tauri::Wry> {
    collect_commands![
        menu::get_app_menu,
        menu::execute_menu_command,
        world::save_world,
        world::create_world,
        world::open_world,
        world::close_world
    ]
}
