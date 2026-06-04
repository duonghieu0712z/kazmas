mod world;

use tauri::Runtime;
use tauri_specta::{Commands, collect_commands};

pub(crate) fn commands<R: Runtime>() -> Commands<R> {
    collect_commands![world::create_world]
}
