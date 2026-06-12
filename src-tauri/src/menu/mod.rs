mod builder;
mod command;
mod handler;

use tauri::{AppHandle, Result, async_runtime::spawn};

pub(crate) fn create_menu(app: &AppHandle) -> Result<()> {
    builder::build_menu(app)?;
    app.on_menu_event(|app, event| {
        let app = app.clone();
        let event = event.clone();
        spawn(async move {
            if let Err(error) = handler::handle_menu_event(&app, event).await {
                log::error!("{error}");
            }
        });
    });

    Ok(())
}
