use std::path::PathBuf;

use tauri::{AppHandle, State, WebviewWindow};
use tauri_specta::Event;

use crate::{
    app::KazmasError,
    event::WorldChangedEvent,
    state::AppState,
    utils::{parse_window_label, target_window},
};

#[tauri::command]
pub(crate) async fn test_save_world_as(
    app: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
    path: PathBuf,
) -> Result<(), String> {
    save_world_as(app, state, window, path)
        .await
        .map_err(|error| error.to_string())
}

async fn save_world_as(
    app: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
    path: PathBuf,
) -> crate::app::KazmasResult<()> {
    let root = std::env::var_os("KAZMAS_TEST_DATA_DIR")
        .ok_or_else(|| KazmasError::Invalid("test data directory is not configured".into()))?;
    let root = std::fs::canonicalize(root).map_err(KazmasError::from)?;
    let parent = path
        .parent()
        .ok_or_else(|| KazmasError::Invalid("test save path has no parent".into()))?;
    if !std::fs::canonicalize(parent)
        .map_err(KazmasError::from)?
        .starts_with(root)
    {
        return Err(KazmasError::Invalid(
            "test save path is outside test data directory".into(),
        ));
    }
    let window_id = parse_window_label(window.label())?
        .ok_or_else(|| KazmasError::Invalid("test window has no id".into()))?;
    let project_id = state
        .registry()
        .get_project_id(window_id)
        .await
        .ok_or_else(|| KazmasError::NotFound("test window has no project".into()))?;
    state
        .project_manager()
        .save_project_as(project_id, path)
        .await?;
    WorldChangedEvent(false)
        .emit_to(&app, target_window(window_id))
        .map_err(KazmasError::from)?;
    Ok(())
}
