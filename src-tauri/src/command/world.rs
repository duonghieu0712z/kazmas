use std::path::PathBuf;

use chrono::{DateTime, Utc};
use serde::Serialize;
use specta::Type;
use tauri::{AppHandle, State, WebviewWindow};
use uuid::Uuid;

use super::error::CommandResult;
use crate::{
    app::{focus_existing_world, open_project_in_window},
    state::AppState,
    utils::{app_temp_dir, parse_window_label},
    world::{WorldManifest, WorldProject},
};

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(super) struct WorldManifestDto {
    id: Uuid,
    name: String,
    created_at: DateTime<Utc>,
    modified_at: DateTime<Utc>,
    opened_at: DateTime<Utc>,
}

impl From<WorldManifest> for WorldManifestDto {
    fn from(manifest: WorldManifest) -> Self {
        Self {
            id: manifest.id,
            name: manifest.name,
            created_at: manifest.created_at,
            modified_at: manifest.modified_at,
            opened_at: manifest.opened_at,
        }
    }
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_world(
    state: State<'_, AppState>,
    window: WebviewWindow,
) -> CommandResult<Option<WorldManifestDto>> {
    let Some(window_id) = parse_window_label(window.label())? else {
        return Ok(None);
    };

    let registry = state.registry();
    let Some(project_id) = registry.get_project_id(&window_id).await else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let manifest = project_manager.world_manifest(&project_id).await?;
    Ok(manifest.map(Into::into))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_world(
    app: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: &str,
    path: PathBuf,
    new_window: bool,
) -> CommandResult<Option<WorldManifestDto>> {
    let window_id = parse_window_label(window.label())?;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::create_world(name, path, temp_dir).await?;
    let manifest = project.manifest();

    open_project_in_window(&app, state, window_id.as_ref(), project, new_window).await?;
    Ok((!new_window).then(|| manifest.into()))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn open_world(
    app: AppHandle,
    state: State<'_, AppState>,
    window: WebviewWindow,
    file: PathBuf,
    new_window: bool,
) -> CommandResult<Option<WorldManifestDto>> {
    if focus_existing_world(&app, &file).await? {
        return Ok(None);
    }

    let window_id = parse_window_label(window.label())?;
    let temp_dir = app_temp_dir(&app).await?;
    let project = WorldProject::open_world(file, temp_dir).await?;
    let manifest = project.manifest();

    open_project_in_window(&app, state, window_id.as_ref(), project, new_window).await?;
    Ok((!new_window).then(|| manifest.into()))
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
        state.project_manager().close_project(&project_id).await?;
        state
            .menu_manager()
            .set_project_commands_enabled(false)
            .await?;
    }
    Ok(())
}
