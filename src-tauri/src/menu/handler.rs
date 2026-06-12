use std::{path::PathBuf, str::FromStr};

use tauri::{AppHandle, Manager, menu::MenuEvent};
use tauri_plugin_dialog::DialogExt;
use tokio::fs;
use uuid::Uuid;

use super::command::MenuCommand;
use crate::{
    app::{
        KazmasResult, choose_project_placement, confirm_project_transition, place_project,
        spawn_window,
    },
    state::{AppState, window_label},
    world::{EXTENSION, WorldProject, read_manifest},
};

pub(super) async fn handle_menu_event(
    app: &AppHandle,
    event: MenuEvent,
    window_id: Option<Uuid>,
) -> KazmasResult<()> {
    let Some(id) = event.id.as_ref().strip_prefix("menu:") else {
        return Ok(());
    };

    let command = MenuCommand::from_str(id)?;
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
    if !confirm_project_transition(app, window_id.as_ref()).await? {
        return Ok(());
    }

    let Some(placement) = choose_project_placement(app) else {
        return Ok(());
    };

    let Some(dir) = app
        .dialog()
        .file()
        .set_title("New World")
        .set_can_create_directories(true)
        .blocking_pick_folder()
    else {
        return Ok(());
    };
    let dir = dir.into_path()?;

    let name = "New World";
    let temp_dir = app_temp_dir(app).await?;
    let project = WorldProject::create_world(name, &dir, &temp_dir).await?;

    place_project(app, window_id.as_ref(), placement, project).await?;

    Ok(())
}

async fn open_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();

    if !confirm_project_transition(app, window_id.as_ref()).await? {
        return Ok(());
    }

    let Some(placement) = choose_project_placement(app) else {
        return Ok(());
    };

    let Some(file) = app
        .dialog()
        .file()
        .set_title("Open World")
        .add_filter("Kazmas world", &[EXTENSION])
        .blocking_pick_file()
    else {
        return Ok(());
    };
    let file = file.into_path()?;

    let manifest = read_manifest(&file)?;
    if let Some(window_id) = registry.get_window_id(&manifest.id).await {
        let label = window_label(&window_id);
        if let Some(window) = app.get_webview_window(&label) {
            window.set_title(&manifest.name)?;
            window.show()?;
            window.set_focus()?;
            return Ok(());
        }
    }

    let temp_dir = app_temp_dir(app).await?;
    let project = WorldProject::open_world(&file, &temp_dir).await?;
    place_project(app, window_id.as_ref(), placement, project).await?;

    Ok(())
}

async fn close_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    let Some(window_id) = window_id else {
        return Ok(());
    };

    if !confirm_project_transition(app, Some(&window_id)).await? {
        return Ok(());
    }

    if let Some(project_id) = registry.close_project(&window_id).await {
        manager.close_project(&project_id).await?;
    }

    Ok(())
}

async fn save_world(app: &AppHandle, window_id: Option<Uuid>) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    if let Some(window_id) = window_id
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
