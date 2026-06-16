mod error;
mod menu;

use tauri_specta::{Commands, collect_commands};

pub(crate) fn commands() -> Commands<tauri::Wry> {
    collect_commands![
        menu::get_app_menu,
        menu::execute_menu_command,
        menu::get_project_transition_info,
        menu::save_focused_world,
        menu::pick_new_world_dir,
        menu::pick_world_file,
        menu::create_world,
        menu::open_world,
        menu::close_focused_world
    ]
}
