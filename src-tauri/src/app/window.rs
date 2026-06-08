use tauri::{Manager, Window, WindowEvent, async_runtime::block_on};

use crate::app::{AppState, KazmasResult};

pub(crate) fn handle_window_event(window: &Window, event: &WindowEvent) {
    match event {
        WindowEvent::CloseRequested { .. } => {
            if let Err(error) = block_on(handle_close_requested(window)) {
                log::error!("{error}");
            }
        }
        _ => log::debug!("Window unhandled event {event:?}"),
    }
}

async fn handle_close_requested(window: &Window) -> KazmasResult<()> {
    let state = window.state::<AppState>();
    let project = state.project.lock().await.take();
    if let Some(project) = project {
        project.close_world().await?;
    }

    Ok(())
}
