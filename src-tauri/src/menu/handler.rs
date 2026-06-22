#[cfg(target_os = "macos")]
use std::str::FromStr;

#[cfg(target_os = "macos")]
use tauri::menu::MenuEvent;
use tauri::{AppHandle, EventTarget};
use tauri_specta::Event;
use uuid::Uuid;

use super::command::MenuCommand;
use crate::{
    app::{KazmasResult, spawn_window},
    event::MenuEvents,
    state::get_state,
    utils::window_label,
};

#[cfg(target_os = "macos")]
pub(crate) async fn handle_menu_event(
    app: &AppHandle,
    event: MenuEvent,
    window_id: Option<Uuid>,
) -> KazmasResult<()> {
    let Some(id) = event.id.as_ref().strip_prefix("menu:") else {
        return Ok(());
    };
    handle_command_id(app, id, window_id).await
}

#[cfg(target_os = "macos")]
async fn handle_command_id(app: &AppHandle, id: &str, window_id: Option<Uuid>) -> KazmasResult<()> {
    let id = id.strip_prefix("menu:").unwrap_or(id);
    let command = MenuCommand::from_str(id)?;
    handle_command(app, command, window_id).await
}

pub(crate) async fn handle_command(
    app: &AppHandle,
    command: MenuCommand,
    window_id: Option<Uuid>,
) -> KazmasResult<()> {
    match command {
        MenuCommand::NewWindow => spawn_window(app, None).await?,
        MenuCommand::NewWorld => create_world(app, window_id).await?,
        MenuCommand::OpenWorld => open_world(app, window_id).await?,
        MenuCommand::Save => save_world(app, window_id).await?,
        MenuCommand::CloseWorld => close_world(app, window_id).await?,
        _ => log::debug!("Menu item {} not handled", command.as_ref()),
    }
    Ok(())
}

async fn create_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    if let Some(window_id) = window_id {
        MenuEvents(MenuCommand::NewWorld).emit_to(app, EventTarget::WebviewWindow {
            label: window_label(&window_id),
        })?;
    }
    Ok(())
}

async fn open_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    if let Some(window_id) = window_id {
        MenuEvents(MenuCommand::OpenWorld).emit_to(app, EventTarget::WebviewWindow {
            label: window_label(&window_id),
        })?;
    }
    Ok(())
}

async fn close_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    if let Some(window_id) = window_id {
        MenuEvents(MenuCommand::CloseWorld).emit_to(app, EventTarget::WebviewWindow {
            label: window_label(&window_id),
        })?;
    }
    Ok(())
}

async fn save_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    let state = get_state(app);
    let registry = state.registry();
    let project_manager = state.project_manager();

    if let Some(window_id) = window_id
        && let Some(project_id) = registry.get_project_id(&window_id).await
    {
        project_manager.save_project(&project_id).await?;
    }

    Ok(())
}
