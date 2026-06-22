use std::path::PathBuf;

use tauri::{AppHandle, State, WebviewWindow};

use super::error::CommandResult;
use crate::{
    app::{focus_existing_world, open_project_in_window},
    state::AppState,
    utils::{app_temp_dir, parse_window_label},
    world::WorldProject,
};

#[tauri::command]
#[specta::specta]
pub(super) async fn create_world(
    app: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: &str,
    path: PathBuf,
    new_window: bool,
) -> CommandResult<()> {
    let window_id = parse_window_label(window.label())?;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::create_world(name, path, temp_dir).await?;

    open_project_in_window(&app, state, window_id.as_ref(), project, new_window).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub(super) async fn open_world(
    app: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
    file: PathBuf,
    new_window: bool,
) -> CommandResult<()> {
    if focus_existing_world(&app, &file).await?.is_none() {
        return Ok(());
    }

    let window_id = parse_window_label(window.label())?;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::open_world(file, temp_dir).await?;

    open_project_in_window(&app, state, window_id.as_ref(), project, new_window).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub(super) async fn close_world(
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> CommandResult<()> {
    let registry = state.registry();
    if let Some(window_id) = parse_window_label(window.label())?
        && let Some(project_id) = registry.close_project(&window_id).await
    {
        let project_manager = state.project_manager();
        project_manager.close_project(&project_id).await?;
    }
    Ok(())
}
