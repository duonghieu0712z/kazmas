use std::path::PathBuf;

use serde::Serialize;
use specta::Type;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

use super::error::CommandResult;
use crate::{
    app::{KazmasError, ProjectPlacement, place_project},
    state::get_state,
    utils::{app_temp_dir, window_label},
    world::{EXTENSION, WorldProject, read_manifest},
};

const NEW_WORLD_NAME: &str = "New World";

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(super) struct ProjectTransitionInfo {
    dirty: bool,
    world_name: Option<String>,
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_project_transition_info(
    app: AppHandle,
) -> CommandResult<ProjectTransitionInfo> {
    let state = get_state(&app);
    let registry = state.registry();
    let project_manager = state.project_manager();

    let Some(window_id) = registry.focused_window().await else {
        return Ok(ProjectTransitionInfo {
            dirty: false,
            world_name: None,
        });
    };

    let Some(project_id) = registry.get_project_id(&window_id).await else {
        return Ok(ProjectTransitionInfo {
            dirty: false,
            world_name: None,
        });
    };

    let world_name = project_manager
        .world_manifest(&project_id)
        .await?
        .map(|manifest| manifest.name);

    Ok(ProjectTransitionInfo {
        dirty: project_manager.is_project_dirty(&project_id).await,
        world_name,
    })
}

#[tauri::command]
#[specta::specta]
pub(super) async fn save_focused_world(app: AppHandle) -> CommandResult<()> {
    let state = get_state(&app);
    let registry = state.registry();
    let project_manager = state.project_manager();

    if let Some(window_id) = registry.focused_window().await
        && let Some(project_id) = registry.get_project_id(&window_id).await
    {
        project_manager.save_project(&project_id).await?;
    }

    Ok(())
}

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
    dir: String,
    placement: ProjectPlacement,
) -> CommandResult<()> {
    let window_id = get_state(&app).registry().focused_window().await;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::create_world(NEW_WORLD_NAME, PathBuf::from(dir), temp_dir).await?;

    place_project(&app, window_id.as_ref(), placement, project).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub(super) async fn open_world(
    app: AppHandle,
    file: String,
    placement: ProjectPlacement,
) -> CommandResult<()> {
    let state = get_state(&app);
    let registry = state.registry();

    let file = PathBuf::from(file);
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

    let window_id = registry.focused_window().await;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::open_world(file, temp_dir).await?;

    place_project(&app, window_id.as_ref(), placement, project).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub(super) async fn close_focused_world(app: AppHandle) -> CommandResult<()> {
    let state = get_state(&app);
    let registry = state.registry();
    let project_manager = state.project_manager();

    if let Some(window_id) = registry.focused_window().await
        && let Some(project_id) = registry.close_project(&window_id).await
    {
        project_manager.close_project(&project_id).await?;
    }

    Ok(())
}
