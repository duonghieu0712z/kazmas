#[cfg(target_os = "macos")]
use std::str::FromStr;

#[cfg(target_os = "macos")]
use tauri::menu::MenuEvent;
use tauri::{AppHandle, Manager};
use tauri_specta::Event;
use uuid::Uuid;

use super::command::{MenuCommand, MenuCommandOwner};
use crate::{
    app::{KazmasResult, spawn_window},
    event::{MenuCommandEvent, WorldChangedEvent},
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
    let command = MenuCommand::from_str(id)?;
    handle_command(app, command, window_id).await
}

pub(crate) async fn handle_command(
    app: &AppHandle,
    command: MenuCommand,
    window_id: Option<Uuid>,
) -> KazmasResult<()> {
    match command.owner() {
        MenuCommandOwner::Backend => handle_backend_command(app, command, window_id).await?,
        MenuCommandOwner::Frontend => emit_menu_event(app, window_id, command)?,
        MenuCommandOwner::Native => {}
        MenuCommandOwner::Unimplemented => {
            log::warn!("menu command {} is not implemented", command.as_ref());
        }
    }
    Ok(())
}

async fn handle_backend_command(
    app: &AppHandle,
    command: MenuCommand,
    window_id: Option<Uuid>,
) -> KazmasResult<()> {
    match command {
        MenuCommand::NewWindow => spawn_window(app, None).await?,
        MenuCommand::Save => save_world(app, window_id).await?,
        MenuCommand::ToggleDevtools => toggle_devtools(app, window_id),
        _ => {}
    }
    Ok(())
}

async fn save_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    let state = get_state(app);
    let registry = state.registry();
    if let Some(window_id) = window_id
        && let Some(project_id) = registry.get_project_id(&window_id).await
    {
        let project_manager = state.project_manager();
        project_manager.save_project(&project_id).await?;

        if let Some(dirty) = project_manager.project_dirty(&project_id).await
            && let Some(window) = app.get_webview_window(&window_label(&window_id))
        {
            WorldChangedEvent(dirty).emit(&window)?;
        }
    }

    Ok(())
}

fn toggle_devtools(app: &AppHandle, window_id: Option<Uuid>) {
    let Some(window_id) = window_id else {
        return;
    };

    let label = window_label(&window_id);
    let Some(window) = app.get_webview_window(&label) else {
        return;
    };

    if window.is_devtools_open() {
        window.close_devtools();
    } else {
        window.open_devtools();
    }
}

fn emit_menu_event(
    app: &AppHandle,
    window_id: Option<Uuid>,
    command: MenuCommand,
) -> KazmasResult<()> {
    if let Some(window_id) = window_id
        && let Some(window) = app.get_webview_window(&window_label(&window_id))
    {
        MenuCommandEvent(command).emit(&window)?;
    }
    Ok(())
}
