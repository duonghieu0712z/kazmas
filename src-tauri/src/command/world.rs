use std::path::PathBuf;

use tauri::{AppHandle, Manager, State, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use super::error::CommandResult;
use crate::{
    app::{KazmasError, place_project},
    state::AppState,
    utils::{app_temp_dir, parse_window_label, window_label},
    world::{EXTENSION, WorldProject, read_manifest},
};

const NEW_WORLD_NAME: &str = "New World";

#[tauri::command]
#[specta::specta]
pub(super) fn pick_new_world_dir(app: AppHandle) -> CommandResult<Option<String>> {
    let dir = app
        .dialog()
        .file()
        .set_title("New World")
        .set_can_create_directories(true)
        .blocking_pick_folder()
        .map(|path| path.into_path())
        .transpose()
        .map_err(KazmasError::from)?
        .map(|path| path.to_string_lossy().to_string());

    Ok(dir)
}

#[tauri::command]
#[specta::specta]
pub(super) fn pick_world_file(app: AppHandle) -> CommandResult<Option<String>> {
    let file = app
        .dialog()
        .file()
        .set_title("Open World")
        .add_filter("Kazmas world", &[EXTENSION])
        .blocking_pick_file()
        .map(|path| path.into_path())
        .transpose()
        .map_err(KazmasError::from)?
        .map(|path| path.to_string_lossy().to_string());

    Ok(file)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_world(
    app: AppHandle,
    window: WebviewWindow,
    path: PathBuf,
    new_window: bool,
) -> CommandResult<()> {
    let window_id = parse_window_label(window.label())?;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::create_world(NEW_WORLD_NAME, path, temp_dir).await?;

    place_project(&app, window_id.as_ref(), new_window, project).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub(super) async fn open_world(
    app: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
    file: String,
    new_window: bool,
) -> CommandResult<()> {
    let registry = state.registry();

    let manifest = read_manifest(&file)?;
    if let Some(window_id) = registry.get_window_id(&manifest.id).await {
        let label = window_label(&window_id);
        if let Some(window) = app.get_webview_window(&label) {
            window
                .set_title(&manifest.name)
                .map_err(KazmasError::from)?;
            window.show().map_err(KazmasError::from)?;
            window.set_focus().map_err(KazmasError::from)?;
            return Ok(());
        }
    }

    let window_id = parse_window_label(window.label())?;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::open_world(file, temp_dir).await?;

    place_project(&app, window_id.as_ref(), new_window, project).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub(super) async fn save_world(
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> CommandResult<()> {
    let registry = state.registry();
    if let Some(window_id) = parse_window_label(window.label())?
        && let Some(project_id) = registry.get_project_id(&window_id).await
    {
        let project_manager = state.project_manager();
        project_manager.save_project(&project_id).await?;
    }
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
