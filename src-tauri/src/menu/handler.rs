use std::path::PathBuf;
#[cfg(target_os = "macos")]
use std::str::FromStr;

#[cfg(target_os = "macos")]
use tauri::menu::MenuEvent;
use tauri::{AppHandle, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use tauri_specta::Event;
use uuid::Uuid;

use super::command::{MenuCommand, MenuCommandOwner};
use crate::{
    app::{KazmasError, KazmasResult, spawn_window},
    event::{MenuCommandEvent, WorldChangedEvent},
    state::get_state,
    utils::{current_window, target_window},
    world::EXTENSION,
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
        #[cfg(not(target_os = "macos"))]
        MenuCommand::CloseWindow => close_window(app, window_id)?,
        MenuCommand::NewWindow => spawn_window(app, None).await?,
        #[cfg(not(target_os = "macos"))]
        MenuCommand::Quit => app.exit(0),
        MenuCommand::Save => save_world(app, window_id).await?,
        MenuCommand::SaveAs => save_world_as(app, window_id).await?,
        MenuCommand::ToggleDevtools => toggle_devtools(app, window_id),
        _ => {}
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn close_window(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    if let Some(window) = current_window(app, window_id) {
        window.close()?;
    }
    Ok(())
}

async fn save_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    let state = get_state(app);
    let registry = state.registry();
    if let Some(window_id) = window_id
        && let Some(project_id) = registry.get_project_id(window_id).await
    {
        let project_manager = state.project_manager();
        project_manager.save_project(project_id).await?;

        if let Some(dirty) = project_manager.project_dirty(project_id).await {
            WorldChangedEvent(dirty).emit_to(app, target_window(window_id))?;
        }
    }

    Ok(())
}

async fn save_world_as(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    let Some(window_id) = window_id else {
        return Ok(());
    };

    let state = get_state(app);
    let registry = state.registry();
    let Some(project_id) = registry.get_project_id(window_id).await else {
        return Ok(());
    };

    let project_manager = state.project_manager();
    let Some(manifest) = project_manager.world_manifest(project_id).await? else {
        return Ok(());
    };

    let Some(window) = current_window(app, Some(window_id)) else {
        return Ok(());
    };

    let Some(path) = save_world_path(app, &window, &manifest.name)? else {
        return Ok(());
    };

    project_manager.save_project_as(project_id, path).await?;
    window.set_title(&manifest.name)?;

    if let Some(dirty) = project_manager.project_dirty(project_id).await {
        WorldChangedEvent(dirty).emit_to(app, target_window(window_id))?;
    }

    Ok(())
}

fn save_world_path(
    app: &AppHandle,
    window: &WebviewWindow,
    name: &str,
) -> KazmasResult<Option<PathBuf>> {
    let path = app
        .dialog()
        .file()
        .set_parent(window)
        .set_title("Save World As")
        .set_file_name(format!("{name} copy.{EXTENSION}"))
        .add_filter("Kazmas World", &[EXTENSION])
        .blocking_save_file()
        .map(|path| {
            path.into_path()
                .map(normalize_world_path)
                .map_err(|error| KazmasError::Invalid(error.to_string()))
        })
        .transpose()?;

    Ok(path)
}

fn normalize_world_path(mut path: PathBuf) -> PathBuf {
    if path.extension().is_none() {
        path.set_extension(EXTENSION);
    }
    path
}

fn toggle_devtools(app: &AppHandle, window_id: Option<Uuid>) {
    let Some(window) = current_window(app, window_id) else {
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
    if let Some(window_id) = window_id {
        MenuCommandEvent(command).emit_to(app, target_window(window_id))?;
    }
    Ok(())
}
