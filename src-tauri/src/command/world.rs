use tauri::{AppHandle, Runtime, State};

use super::error::CommandResult;
use crate::{
    app::{self, AppState},
    dto::WorldDto,
    world::WorldProject,
};

#[tauri::command]
#[specta::specta]
pub(super) fn create_world<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AppState>,
    name: &str,
    path: &str,
) -> CommandResult<WorldDto> {
    let mut project = app::lock_mutex(&state.project)?;
    *project = Some(WorldProject::create_world(&app, name, path)?);

    let project = project.as_ref().unwrap();
    log::debug!("package path: {}", project.package.display());
    log::debug!("workspace path: {}", project.workspace.display());
    Ok(project.manifest.clone().into())
}

#[tauri::command]
#[specta::specta]
pub(super) fn open_world<R: Runtime>(
    _app: AppHandle<R>,
    _state: State<'_, AppState>,
    _path: &str,
) -> CommandResult<()> {
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub(super) fn save_world<R: Runtime>(
    _app: AppHandle<R>,
    _state: State<'_, AppState>,
) -> CommandResult<()> {
    Ok(())
}
