use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{State, WebviewWindow};
use tauri_specta::Event;
use uuid::Uuid;

use super::error::CommandResult;
use crate::{
    app::{KazmasError, KazmasResult},
    event::WorldChangedEvent,
    model::{Document, Node, NodeKind, NodeMetadata},
    state::AppState,
    utils::parse_window_label,
};

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(super) struct NodeDto {
    id: Uuid,
    parent_id: Option<Uuid>,
    kind: NodeKind,
    name: String,
    created_at: DateTime<Utc>,
    modified_at: DateTime<Utc>,
    deleted_at: Option<DateTime<Utc>>,
}

impl From<Node> for NodeDto {
    fn from(node: Node) -> Self {
        Self {
            id: node.id,
            parent_id: node.parent_id,
            kind: node.kind,
            name: node.name,
            created_at: node.created_at,
            modified_at: node.modified_at,
            deleted_at: node.deleted_at,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub(super) struct UpdateNodeDto {
    id: Uuid,
    parent_id: Option<Uuid>,
    name: String,
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
) -> CommandResult<Option<NodeDto>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let node = project_manager.get_node(&project_id, &node_id).await?;
    Ok(node.map(Into::into))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_metadata(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
) -> CommandResult<Option<String>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let metadata = project_manager.get_metadata(&project_id, &node_id).await?;
    let metadata = metadata
        .map(|metadata| serde_json::to_string(&metadata.data))
        .transpose()
        .map_err(KazmasError::from)?;
    Ok(metadata)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_document(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
) -> CommandResult<Option<String>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let document = project_manager.get_document(&project_id, &node_id).await?;
    let document = document
        .map(|document| serde_json::to_string(&document.content))
        .transpose()
        .map_err(KazmasError::from)?;
    Ok(document)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_folder(
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: Option<&str>,
    parent_id: Option<Uuid>,
) -> CommandResult<Option<Uuid>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let id = project_manager
        .create_folder(&project_id, name, parent_id)
        .await?;
    if id.is_some() {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(id)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_chapter(
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: Option<&str>,
    parent_id: Option<Uuid>,
) -> CommandResult<Option<Uuid>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let id = project_manager
        .create_chapter(&project_id, name, parent_id)
        .await?;
    if id.is_some() {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(id)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_wiki_entry(
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: Option<&str>,
    parent_id: Option<Uuid>,
) -> CommandResult<Option<Uuid>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let id = project_manager
        .create_wiki_entry(&project_id, name, parent_id)
        .await?;
    if id.is_some() {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(id)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn update_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node: UpdateNodeDto,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let Some(mut existing) = project_manager.get_node(&project_id, &node.id).await? else {
        return Ok(None);
    };

    existing.parent_id = node.parent_id;
    existing.name = node.name;
    existing.modified_at = Utc::now();

    let updated = project_manager.update_node(&project_id, &existing).await?;
    if updated == Some(true) {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(updated)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn update_metadata(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
    data: &str,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let data = serde_json::from_str(data).map_err(KazmasError::from)?;
    let updated = project_manager
        .update_metadata(&project_id, &NodeMetadata::new(node_id, data))
        .await?;
    if updated == Some(true) {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(updated)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn update_document(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
    content: &str,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let content = serde_json::from_str(content).map_err(KazmasError::from)?;
    let updated = project_manager
        .update_document(&project_id, &Document::new(node_id, content))
        .await?;
    if updated == Some(true) {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(updated)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn delete_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let deleted = project_manager.delete_node(&project_id, &node_id).await?;
    if deleted == Some(true) {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(deleted)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn restore_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let restored = project_manager.restore_node(&project_id, &node_id).await?;
    if restored == Some(true) {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(restored)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn purge_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: Uuid,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };

    let project_manager = state.project_manager();
    let purged = project_manager.purge_node(&project_id, &node_id).await?;
    if purged == Some(true) {
        emit_world_changed(&window, project_manager.project_dirty(&project_id).await)?;
    }
    Ok(purged)
}

async fn current_project_id(
    state: &State<'_, AppState>,
    window: &WebviewWindow,
) -> KazmasResult<Option<Uuid>> {
    let Some(window_id) = parse_window_label(window.label())? else {
        return Ok(None);
    };

    let registry = state.registry();
    Ok(registry.get_project_id(&window_id).await)
}

fn emit_world_changed(window: &WebviewWindow, dirty: Option<bool>) -> KazmasResult<()> {
    if let Some(dirty) = dirty {
        WorldChangedEvent(dirty).emit(window)?;
    }
    Ok(())
}
