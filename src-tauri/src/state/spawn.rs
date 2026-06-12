use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
    async_runtime::spawn,
};
use uuid::Uuid;

use super::label::{parse_window_label, window_label};
use crate::{app::KazmasResult, state::AppState};

const WEBVIEW_URL: &str = "index.html";
const WINDOW_TITLE: &str = "New World";
const WINDOW_WIDTH: f64 = 1200.0;
const WINDOW_HEIGHT: f64 = 800.0;

pub(crate) async fn spawn_window(app: &AppHandle, project_id: Option<&Uuid>) -> KazmasResult<()> {
    let window_id = Uuid::now_v7();
    let label = window_label(&window_id);

    let state = app.state::<AppState>();
    state
        .registry()
        .register_window(&window_id, project_id)
        .await?;

    let window = WebviewWindowBuilder::new(app, &label, WebviewUrl::App(WEBVIEW_URL.into()))
        .title(WINDOW_TITLE)
        .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
        .center()
        .build()?;

    if let Some(project_id) = project_id {
        if let Some(manifest) = state.manager().world_manifest(project_id).await? {
            window.set_title(&manifest.name)?;
        }
    }

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
            if let Some(project_id) = state.registry().unregister_window(&window_id).await {
                state.manager().close_project(&project_id).await?;
            }
        }
        _ => log::debug!("Window unhandled event {event:?}"),
    }
    Ok(())
}
