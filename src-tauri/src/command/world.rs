use tauri::State;

use crate::app::{self, AppState, KazmasResult};

#[tauri::command]
#[specta::specta]
pub(super) fn create_world(state: State<'_, AppState>, name: &str, path: &str) -> KazmasResult<()> {
    log::debug!("Create world name '{name}' at {path}");

    let project = app::lock_mutex(&state.project)?;
    log::debug!("Current world project: {project:?}");
    Ok(())
}
