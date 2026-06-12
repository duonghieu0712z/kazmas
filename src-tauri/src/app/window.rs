use tauri::{Window, WindowEvent};

pub(crate) fn handle_window_event(window: &Window, event: &WindowEvent) {
    match event {
        WindowEvent::CloseRequested { .. } => {
            log::debug!("Window close requested {}", window.label());
        }
        _ => log::debug!("Window unhandled event {event:?}"),
    }
}
