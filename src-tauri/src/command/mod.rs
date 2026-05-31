use tauri::Runtime;
use tauri_specta::{Commands, collect_commands};

pub fn commands<R: Runtime>() -> Commands<R> {
    collect_commands![]
}
