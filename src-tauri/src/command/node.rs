use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{State, WebviewWindow};
use uuid::Uuid;

use super::error::CommandResult;
use crate::{
    app::{KazmasError, KazmasResult},
    model::{Document, Node, NodeKind, NodeMetadata},
    state::AppState,
    utils::parse_window_label,
};

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub(super) struct NodeDto {
    #[specta(type = String)]
    id: Uuid,
    #[specta(type = Option<String>)]
    parent_id: Option<Uuid>,
    kind: NodeKind,
    name: String,
    #[specta(type = String)]
    created_at: DateTime<Utc>,
    #[specta(type = String)]
    modified_at: DateTime<Utc>,
    #[specta(type = Option<String>)]
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
    id: String,
    parent_id: Option<String>,
    name: String,
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
) -> CommandResult<Option<NodeDto>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;

    let project_manager = state.project_manager();
    let node = project_manager.get_node(&project_id, &node_id).await?;
    Ok(node.map(Into::into))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_metadata(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
) -> CommandResult<Option<String>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;

    let project_manager = state.project_manager();
    let metadata = project_manager.get_metadata(&project_id, &node_id).await?;
    Ok(metadata.map(|metadata| metadata.data.to_string()))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn get_document(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
) -> CommandResult<Option<String>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;

    let project_manager = state.project_manager();
    let document = project_manager.get_document(&project_id, &node_id).await?;
    Ok(document.map(|document| document.content.to_string()))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_folder(
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: Option<String>,
    parent_id: Option<String>,
) -> CommandResult<Option<String>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let parent_id = parse_optional_uuid(parent_id.as_deref())?;

    let project_manager = state.project_manager();
    let id = project_manager
        .create_folder(&project_id, name.as_deref(), parent_id)
        .await?;
    Ok(id.map(|id| id.to_string()))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_chapter(
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: Option<String>,
    parent_id: Option<String>,
) -> CommandResult<Option<String>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let parent_id = parse_optional_uuid(parent_id.as_deref())?;

    let project_manager = state.project_manager();
    let id = project_manager
        .create_chapter(&project_id, name.as_deref(), parent_id)
        .await?;
    Ok(id.map(|id| id.to_string()))
}

#[tauri::command]
#[specta::specta]
pub(super) async fn create_wiki_entry(
    state: State<'_, AppState>,
    window: WebviewWindow,
    name: Option<String>,
    parent_id: Option<String>,
) -> CommandResult<Option<String>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let parent_id = parse_optional_uuid(parent_id.as_deref())?;

    let project_manager = state.project_manager();
    let id = project_manager
        .create_wiki_entry(&project_id, name.as_deref(), parent_id)
        .await?;
    Ok(id.map(|id| id.to_string()))
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
    let node_id = parse_uuid(&node.id)?;
    let parent_id = parse_optional_uuid(node.parent_id.as_deref())?;

    let project_manager = state.project_manager();
    let Some(mut existing) = project_manager.get_node(&project_id, &node_id).await? else {
        return Ok(None);
    };

    existing.parent_id = parent_id;
    existing.name = node.name;
    existing.modified_at = Utc::now();

    project_manager
        .update_node(&project_id, &existing)
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn update_metadata(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
    data: String,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;
    let data = parse_json(&data)?;

    let project_manager = state.project_manager();
    project_manager
        .update_metadata(&project_id, &NodeMetadata::new(node_id, data))
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn update_document(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
    content: String,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;
    let content = parse_json(&content)?;

    let project_manager = state.project_manager();
    project_manager
        .update_document(&project_id, &Document::new(node_id, content))
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn delete_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;

    let project_manager = state.project_manager();
    project_manager
        .delete_node(&project_id, &node_id)
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn restore_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;

    let project_manager = state.project_manager();
    project_manager
        .restore_node(&project_id, &node_id)
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn purge_node(
    state: State<'_, AppState>,
    window: WebviewWindow,
    node_id: String,
) -> CommandResult<Option<bool>> {
    let Some(project_id) = current_project_id(&state, &window).await? else {
        return Ok(None);
    };
    let node_id = parse_uuid(&node_id)?;

    let project_manager = state.project_manager();
    project_manager
        .purge_node(&project_id, &node_id)
        .await
        .map_err(Into::into)
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

fn parse_uuid(value: &str) -> KazmasResult<Uuid> {
    value
        .parse()
        .map_err(|error| KazmasError::Invalid(format!("invalid uuid {value}: {error}")))
}

fn parse_optional_uuid(value: Option<&str>) -> KazmasResult<Option<Uuid>> {
    value.map(parse_uuid).transpose()
}

fn parse_json(value: &str) -> KazmasResult<serde_json::Value> {
    serde_json::from_str(value)
        .map_err(|error| KazmasError::Invalid(format!("invalid json payload: {error}")))
}
