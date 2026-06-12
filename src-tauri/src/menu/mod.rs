mod builder;
mod command;
mod handler;

use tauri::{AppHandle, Manager, Result, async_runtime::spawn};

pub(crate) fn create_menu(app: &AppHandle) -> Result<()> {
    builder::build_menu(app)?;
    app.on_menu_event(|app, event| {
        let app = app.clone();
        let event = event.clone();
        spawn(async move {
            let window_id = app
                .state::<crate::state::AppState>()
                .registry()
                .focused_window()
                .await;
            if let Err(error) = handler::handle_menu_event(&app, event, window_id).await {
                log::error!("{error}");
            }
        });
    });

    Ok(())
}
