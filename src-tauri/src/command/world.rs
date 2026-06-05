use std::{fs, path::PathBuf};

use tauri::{AppHandle, Manager, Runtime, State};

use super::error::CommandResult;
use crate::{
    app::{self, AppState, KazmasResult},
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
    let temp_dir = project_temp_dir(&app)?;
    let new_project = WorldProject::create_world(name, path, temp_dir)?;

    let world = new_project.manifest().into();
    *project = Some(new_project);
    Ok(world)
}

#[tauri::command]
#[specta::specta]
pub(super) fn open_world<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AppState>,
    path: &str,
) -> CommandResult<WorldDto> {
    let mut project = app::lock_mutex(&state.project)?;
    let temp_dir = project_temp_dir(&app)?;
    let new_project = WorldProject::open_world(path, temp_dir)?;

    let world = new_project.manifest().into();
    *project = Some(new_project);
    Ok(world)
}

#[tauri::command]
#[specta::specta]
pub(super) fn save_world(state: State<'_, AppState>) -> CommandResult<()> {
    if let Some(project) = app::lock_mutex(&state.project)?.as_ref() {
        project.save_world()?;
    }
    Ok(())
}

fn project_temp_dir<R: Runtime>(app: &AppHandle<R>) -> KazmasResult<PathBuf> {
    let path = app.path().temp_dir()?.join(&app.config().identifier);
    fs::create_dir_all(&path)?;
    Ok(path)
}
