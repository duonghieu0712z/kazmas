use tauri::Runtime;
use tauri_specta::{Commands, collect_commands};

pub fn commands<R: Runtime>() -> Commands<R> {
    collect_commands![greet]
}

#[tauri::command]
#[specta::specta]
fn greet(name: &str) -> String {
    log::info!("Backend was called with an argument: {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}
