use std::future::Future;

#[cfg(target_os = "macos")]
use tauri::LogicalPosition;
use tauri::{
    AppHandle, Manager, TitleBarStyle, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
    WindowEvent, async_runtime::spawn,
};
use tauri_plugin_dialog::{
    DialogExt, MessageDialogButtons, MessageDialogKind, MessageDialogResult,
};
use uuid::Uuid;

use super::{KazmasError, KazmasResult};
use crate::{
    state::{AppState, ProjectManager, parse_window_label, window_label},
    world::WorldProject,
};

const WEBVIEW_URL: &str = "index.html";
const WINDOW_TITLE: &str = "New World";
const WINDOW_WIDTH: f64 = 1200.0;
const WINDOW_HEIGHT: f64 = 800.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ProjectPlacement {
    CurrentWindow,
    NewWindow,
}

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

    window.show()?;
    window.set_focus()?;

    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();
    registry.register_window(&window_id, project_id).await?;

    if let Some(project_id) = project_id
        && let Some(manifest) = manager.world_manifest(project_id).await?
    {
        window.set_title(&manifest.name)?;
    }

    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }

    Ok(())
}

pub(crate) async fn confirm_project_transition(
    app: &AppHandle,
    window_id: Option<&Uuid>,
) -> KazmasResult<bool> {
    let Some(window_id) = window_id else {
        return Ok(true);
    };

    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    let Some(project_id) = registry.get_project_id(window_id).await else {
        return Ok(true);
    };

    if !manager.is_project_dirty(&project_id).await {
        return Ok(true);
    }

    let message = if let Some(manifest) = manager.world_manifest(&project_id).await? {
        format!("Save changes to {} before continuing?", manifest.name)
    } else {
        "Save changes before continuing?".to_string()
    };

    let result = app
        .dialog()
        .message(message)
        .title("Unsaved Changes")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::YesNoCancelCustom(
            "Save".into(),
            "Don't Save".into(),
            "Cancel".into(),
        ))
        .blocking_show_with_result();

    match result {
        MessageDialogResult::Yes => {
            manager.save_project(&project_id).await?;
            Ok(true)
        }
        MessageDialogResult::Custom(value) if value == "Save" => {
            manager.save_project(&project_id).await?;
            Ok(true)
        }
        MessageDialogResult::No => Ok(true),
        MessageDialogResult::Custom(value) if value == "Don't Save" => Ok(true),
        _ => Ok(false),
    }
}

pub(crate) fn choose_project_placement(app: &AppHandle) -> Option<ProjectPlacement> {
    let result = app
        .dialog()
        .message("Use a new window for this world?")
        .title("Window Placement")
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::YesNoCancelCustom(
            "New Window".into(),
            "Current Window".into(),
            "Cancel".into(),
        ))
        .blocking_show_with_result();

    match result {
        MessageDialogResult::Yes => Some(ProjectPlacement::NewWindow),
        MessageDialogResult::Custom(value) if value == "New Window" => {
            Some(ProjectPlacement::NewWindow)
        }
        MessageDialogResult::No => Some(ProjectPlacement::CurrentWindow),
        MessageDialogResult::Custom(value) if value == "Current Window" => {
            Some(ProjectPlacement::CurrentWindow)
        }
        _ => None,
    }
}

pub(crate) async fn place_project(
    app: &AppHandle,
    window_id: Option<&Uuid>,
    placement: ProjectPlacement,
    project: WorldProject,
) -> KazmasResult<()> {
    let state = app.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();
    let manifest = project.manifest();

    match placement {
        ProjectPlacement::CurrentWindow => {
            let Some(window_id) = window_id else {
                return Err(KazmasError::Invalid(
                    "No window available for CurrentWindow placement".into(),
                ));
            };

            let prev_project_id = open_project_or_close(manager, project, async {
                registry.replace_project(window_id, &manifest.id).await
            })
            .await?;

            if let Some(prev_project_id) = prev_project_id
                && prev_project_id != manifest.id
            {
                manager.close_project(&prev_project_id).await?;
            }
        }
        ProjectPlacement::NewWindow => {
            open_project_or_close(manager, project, async {
                spawn_window(app, Some(&manifest.id)).await
            })
            .await?;
        }
    }

    Ok(())
}

async fn open_project_or_close<T>(
    manager: &ProjectManager,
    project: WorldProject,
    action: impl Future<Output = KazmasResult<T>>,
) -> KazmasResult<T> {
    let project_id = project.manifest().id;
    manager.open_project(project).await?;

    let result = action.await;
    if let Err(error) = result {
        return close_project_after_failure(manager, &project_id, error).await;
    }

    result
}

async fn close_project_after_failure<T>(
    manager: &ProjectManager,
    project_id: &Uuid,
    error: KazmasError,
) -> KazmasResult<T> {
    if let Err(cleanup_error) = manager.close_project(project_id).await {
        return Err(KazmasError::Invalid(format!(
            "{error}; cleanup failed: {cleanup_error}"
        )));
    }

    Err(error)
}

async fn handle_webview_window_event(
    window: &WebviewWindow,
    event: &WindowEvent,
) -> KazmasResult<()> {
    let state = window.state::<AppState>();
    let registry = state.registry();
    let manager = state.manager();

    let Some(window_id) = parse_window_label(window.label())? else {
        return Ok(());
    };

    match event {
        WindowEvent::Focused(flag) => {
            if *flag {
                registry.set_focus(Some(&window_id)).await;
            } else if Some(window_id) == registry.focused_window().await {
                registry.set_focus(None).await;
            }
        }
        WindowEvent::Destroyed => {
            if Some(window_id) == registry.focused_window().await {
                registry.set_focus(None).await;
            }
            if let Some(project_id) = registry.unregister_window(&window_id).await {
                manager.close_project(&project_id).await?;
            }
        }
        _ => log::debug!("Window unhandled event {event:?}"),
    }
    Ok(())
}
