use tauri::{AppHandle, EventTarget, Manager, WebviewWindow};
use uuid::Uuid;

use super::window_label;

pub(crate) fn current_window(app: &AppHandle, window_id: Option<Uuid>) -> Option<WebviewWindow> {
    app.get_webview_window(&window_label(window_id?))
}

pub(crate) fn target_window(window_id: Uuid) -> EventTarget {
    EventTarget::webview_window(window_label(window_id))
}
