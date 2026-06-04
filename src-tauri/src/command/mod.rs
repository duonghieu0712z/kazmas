mod error;
mod world;

use tauri::{Runtime, Wry};
use tauri_specta::{Commands, collect_commands};

pub(crate) fn commands<R: Runtime>() -> Commands<R> {
    collect_commands![
        world::create_world<Wry>,
        world::open_world<Wry>,
        world::save_world<Wry>,
    ]
}
