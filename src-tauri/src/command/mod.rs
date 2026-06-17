mod error;
mod menu;
mod world;

use tauri_specta::{Commands, collect_commands};

pub(crate) fn commands() -> Commands<tauri::Wry> {
    collect_commands![
        menu::get_app_menu,
        menu::execute_menu_command,
        world::get_project_transition_info,
        world::save_focused_world,
        world::pick_new_world_dir,
        world::pick_world_file,
        world::create_world,
        world::open_world,
        world::close_focused_world
    ]
}
