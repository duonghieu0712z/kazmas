use std::{path::PathBuf, str::FromStr};

use tauri::{AppHandle, Manager, menu::MenuEvent};
use tokio::fs;

use super::command::MenuCommand;
use crate::{
    app::KazmasResult,
    state::{AppState, spawn_window},
    world::WorldProject,
};

pub(super) async fn handle_menu_event(app: &AppHandle, event: MenuEvent) -> KazmasResult<()> {
    let Some(id) = event.id.as_ref().strip_prefix("menu:") else {
        return Ok(());
    };

    let command = MenuCommand::from_str(id)?;
    match command {
        MenuCommand::NewWindow => spawn_window(app, None).await?,
        MenuCommand::NewWorld => create_world(app).await?,
        MenuCommand::OpenWorld => open_world(app).await?,
        MenuCommand::Save => save_world(app).await?,
        MenuCommand::CloseWorld => close_world(app).await?,
        _ => log::debug!("Menu item {} not handled", command.as_ref()),
    }

    Ok(())
}

async fn create_world(app: &AppHandle) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    let name = "New World";
    let path = "/path/to/documents";
    let temp_dir = app_temp_dir(app).await?;

    if let Some(window_id) = registry.focused_window().await {
        let project = WorldProject::create_world(name, path, &temp_dir).await?;
        let manifest = project.manifest();

        registry.replace_project(&window_id, &manifest.id).await?;
        manager.open_project(project).await?;
    }

    Ok(())
}

async fn open_world(app: &AppHandle) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    let path = "/path/to/documents/New World.kazmas";
    let temp_dir = app_temp_dir(app).await?;

    if let Some(window_id) = registry.focused_window().await {
        let project = WorldProject::open_world(path, &temp_dir).await?;
        let manifest = project.manifest();

        registry.replace_project(&window_id, &manifest.id).await?;
        manager.open_project(project).await?;
    }

    Ok(())
}

async fn close_world(app: &AppHandle) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    if let Some(window_id) = registry.focused_window().await
        && let Some(project_id) = registry.close_project(&window_id).await
    {
        manager.close_project(&project_id).await?;
    }

    Ok(())
}

async fn save_world(app: &AppHandle) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    if let Some(window_id) = registry.focused_window().await
        && let Some(project_id) = registry.get_project_id(&window_id).await
    {
        manager.save_project(&project_id).await?;
    }

    Ok(())
}

async fn app_temp_dir(app: &AppHandle) -> KazmasResult<PathBuf> {
    let path = app.path().temp_dir()?.join(&app.config().identifier);
    fs::create_dir_all(&path).await?;
    Ok(path)
}
