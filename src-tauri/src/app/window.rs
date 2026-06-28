use std::path::Path;

use tauri::{
    AppHandle, Manager, State, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
    async_runtime::spawn,
};
#[cfg(target_os = "macos")]
use tauri::{LogicalPosition, TitleBarStyle};
use uuid::Uuid;

use super::error::{KazmasError, KazmasResult};
use crate::{
    state::{AppState, get_state},
    utils::{parse_window_label, window_label},
    world::{WorldProject, read_manifest},
};

const WEBVIEW_URL: &str = "index.html";
const WINDOW_TITLE: &str = "New World";
const WINDOW_WIDTH: f64 = 1200.0;
const WINDOW_HEIGHT: f64 = 800.0;

pub(crate) async fn spawn_window(app: &AppHandle, project_id: Option<&Uuid>) -> KazmasResult<()> {
    let window_id = Uuid::now_v7();
    let label = window_label(&window_id);

    let builder = WebviewWindowBuilder::new(app, &label, WebviewUrl::App(WEBVIEW_URL.into()))
        .title(WINDOW_TITLE)
        .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
        .center();

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(TitleBarStyle::Overlay)
        .traffic_light_position(LogicalPosition::new(12, 14))
        .hidden_title(true);

    #[cfg(not(target_os = "macos"))]
    let builder = builder.decorations(false);

    let window = builder.build()?;

    let event_window = window.clone();
    window.on_window_event(move |event| {
        let window = event_window.clone();
        let event = event.clone();

        spawn(async move {
            if let Err(error) = handle_webview_window_event(&window, &event).await {
                log::error!("{error}");
            }
        });
    });

    let state = get_state(app);
    let registry = state.registry();
    let project_manager = state.project_manager();
    registry.register_window(&window_id, project_id).await?;

    if let Some(project_id) = project_id
        && let Some(manifest) = project_manager.world_manifest(project_id).await?
    {
        window.set_title(&manifest.name)?;
    }

    focus_window(&window)?;

    #[cfg(debug_assertions)]
    window.open_devtools();

    Ok(())
}

pub(crate) fn focus_window(window: &WebviewWindow) -> KazmasResult<()> {
    window.show()?;
    window.set_focus()?;
    Ok(())
}

pub(crate) async fn focus_existing_world(
    app: &AppHandle,
    file: impl AsRef<Path>,
) -> KazmasResult<bool> {
    let manifest = read_manifest(file)?;

    let state = get_state(app);
    let registry = state.registry();
    let Some(window_id) = registry.get_window_id(&manifest.id).await else {
        return Ok(false);
    };

    let label = window_label(&window_id);
    let Some(window) = app.get_webview_window(&label) else {
        return Ok(false);
    };

    window.set_title(&manifest.name)?;
    focus_window(&window)?;
    Ok(true)
}

pub(crate) async fn open_project_in_window(
    app: &AppHandle,
    state: State<'_, AppState>,
    window_id: Option<&Uuid>,
    project: WorldProject,
    new_window: bool,
) -> KazmasResult<()> {
    let registry = state.registry();
    let project_manager = state.project_manager();
    let project_id = project.id();

    if new_window {
        project_manager
            .open_project_or_close(project, async {
                spawn_window(app, Some(&project_id)).await
            })
            .await?;
        return Ok(());
    }

    let Some(window_id) = window_id else {
        return Err(KazmasError::Invalid(
            "no window available for current window placement".into(),
        ));
    };

    let prev_project_id = project_manager
        .open_project_or_close(project, async {
            registry.replace_project(window_id, &project_id).await
        })
        .await?;

    if let Some(prev_project_id) = prev_project_id
        && prev_project_id != project_id
    {
        project_manager.close_project(&prev_project_id).await?;
    }

    let menu_manager = state.menu_manager();
    menu_manager.set_project_commands_enabled(true).await?;

    Ok(())
}

async fn handle_webview_window_event(
    window: &WebviewWindow,
    event: &WindowEvent,
) -> KazmasResult<()> {
    let state = get_state(window);
    let registry = state.registry();
    let menu_manager = state.menu_manager();
    let project_manager = state.project_manager();

    let Some(window_id) = parse_window_label(window.label())? else {
        return Ok(());
    };

    match event {
        WindowEvent::Focused(flag) => {
            if *flag {
                if Some(window_id) != registry.focused_window().await {
                    registry.set_focus(Some(&window_id)).await;
                    let has_project = registry.get_project_id(&window_id).await.is_some();
                    menu_manager
                        .set_project_commands_enabled(has_project)
                        .await?;
                }
            } else if Some(window_id) == registry.focused_window().await {
                registry.set_focus(None).await;
            }
        }
        WindowEvent::Destroyed => {
            if Some(window_id) == registry.focused_window().await {
                registry.set_focus(None).await;
                menu_manager.set_project_commands_enabled(false).await?;
            }
            if let Some(project_id) = registry.unregister_window(&window_id).await {
                project_manager.close_project(&project_id).await?;
            }
        }
        _ => (),
    }
    Ok(())
}
