use std::{path::PathBuf, str::FromStr};

use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
    async_runtime::spawn, menu::MenuEvent,
};
use tauri_plugin_dialog::DialogExt;
use tokio::fs;
use uuid::Uuid;

use super::command::MenuCommand;
use crate::{
    app::KazmasResult,
    state::{AppState, parse_window_label, window_label},
    world::{WorldProject, read_manifest},
};

const WEBVIEW_URL: &str = "index.html";
const WINDOW_TITLE: &str = "New World";
const WINDOW_WIDTH: f64 = 1200.0;
const WINDOW_HEIGHT: f64 = 800.0;

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

pub(crate) async fn spawn_window(app: &AppHandle, project_id: Option<&Uuid>) -> KazmasResult<()> {
    let window_id = Uuid::now_v7();
    let label = window_label(&window_id);

    let window = WebviewWindowBuilder::new(app, &label, WebviewUrl::App(WEBVIEW_URL.into()))
        .title(WINDOW_TITLE)
        .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
        .center()
        .build()?;

    let event_window = window.clone();
    window.on_window_event(move |event| {
        let window = event_window.clone();
        let event = event.clone();

        spawn(async move {
            if let Err(error) = handle_window_event(&window, &event).await {
                log::error!("{error}");
            }
        });
    });

    window.show()?;
    window.set_focus()?;

    let state = app.state::<AppState>();
    state
        .registry()
        .register_window(&window_id, project_id)
        .await?;

    if let Some(project_id) = project_id
        && let Some(manifest) = state.manager().world_manifest(project_id).await?
    {
        window.set_title(&manifest.name)?;
    }

    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }

    Ok(())
}

async fn handle_window_event(window: &WebviewWindow, event: &WindowEvent) -> KazmasResult<()> {
    let state = window.state::<AppState>();
    let Some(window_id) = parse_window_label(window.label())? else {
        return Ok(());
    };

    match event {
        WindowEvent::Focused(flag) => {
            if *flag {
                state.registry().set_focus(Some(&window_id)).await;
            } else if Some(window_id) == state.registry().focused_window().await {
                state.registry().set_focus(None).await;
            }
        }
        WindowEvent::Destroyed => {
            state.registry().set_focus(None).await;
            if let Some(project_id) = state.registry().unregister_window(&window_id).await {
                state.manager().close_project(&project_id).await?;
            }
        }
        _ => log::debug!("Window unhandled event {event:?}"),
    }
    Ok(())
}

async fn create_world(app: &AppHandle) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

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

    let Some(window_id) = registry.focused_window().await else {
        return Ok(());
    };

    let name = "New World";
    let temp_dir = app_temp_dir(app).await?;
    let project = WorldProject::create_world(name, &dir, &temp_dir).await?;
    let manifest = project.manifest();

    registry.replace_project(&window_id, &manifest.id).await?;
    manager.open_project(project).await?;

    Ok(())
}

async fn open_world(app: &AppHandle) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    let Some(file) = app
        .dialog()
        .file()
        .set_title("Open World")
        .add_filter("Kazmas world", &["kazmas"])
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

    if let Some(window_id) = registry.focused_window().await {
        let temp_dir = app_temp_dir(app).await?;
        let project = WorldProject::open_world(&file, &temp_dir).await?;
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
