mod error;
mod menu;
mod node;
mod world;

use tauri_specta::{Commands, collect_commands};

pub(crate) fn commands() -> Commands<tauri::Wry> {
    collect_commands![
        menu::execute_menu_command,
        world::get_world,
        world::create_world,
        world::open_world,
        world::close_world,
        node::get_node,
        node::get_manuscripts,
        node::get_wikis,
        node::get_metadata,
        node::get_document,
        node::create_folder,
        node::create_manuscript_entry,
        node::create_wiki_entry,
        node::update_node,
        node::update_metadata,
        node::update_document,
        node::delete_node,
        node::restore_node,
        node::purge_node,
    ]
}
