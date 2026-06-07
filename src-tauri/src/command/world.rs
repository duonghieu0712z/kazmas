use std::path::PathBuf;

use tauri::{AppHandle, Manager, Runtime, State};
use tokio::fs;

use super::error::CommandResult;
use crate::{
    app::{AppState, KazmasResult},
    dto::WorldDto,
    world::WorldProject,
};

#[tauri::command]
#[specta::specta]
pub(super) async fn create_world<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AppState>,
    name: &str,
    path: &str,
) -> CommandResult<WorldDto> {
    let temp_dir = project_temp_dir(&app).await?;
    let new_project = WorldProject::create_world(name, path, temp_dir).await?;
    let world = new_project.manifest().into();

    let mut project = state.project.lock().await;
    *project = Some(new_project);

    Ok(world)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn open_world<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AppState>,
    path: &str,
) -> CommandResult<WorldDto> {
    let temp_dir = project_temp_dir(&app).await?;
    let new_project = WorldProject::open_world(path, temp_dir).await?;
    let world = new_project.manifest().into();

    let mut project = state.project.lock().await;
    *project = Some(new_project);

    Ok(world)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn save_world(state: State<'_, AppState>) -> CommandResult<()> {
    let project = state.project.lock().await.take();
    if let Some(mut project) = project {
        let result = project.save_world().await;
        *state.project.lock().await = Some(project);
        result?;
    }

    Ok(())
}

async fn project_temp_dir<R: Runtime>(app: &AppHandle<R>) -> KazmasResult<PathBuf> {
    let path = app.path().temp_dir()?.join(&app.config().identifier);
    fs::create_dir_all(&path).await?;
    Ok(path)
}
