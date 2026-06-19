#[cfg(target_os = "macos")]
mod builder;
mod command;
mod descriptor;
mod handler;

pub(crate) use command::MenuCommand;
pub(crate) use descriptor::MenuGroup;
use tauri::{AppHandle, Manager};
#[cfg(target_os = "macos")]
use tauri::{Result, async_runtime::spawn};

use crate::app::KazmasResult;

pub(crate) fn app_menu(app: &AppHandle) -> Vec<MenuGroup> {
    descriptor::app_menu(&app.package_info().name)
}

pub(crate) async fn execute_command(app: &AppHandle, command: MenuCommand) -> KazmasResult<()> {
    let window_id = app
        .state::<crate::state::AppState>()
        .registry()
        .focused_window()
        .await;

    handler::handle_command(app, command, window_id).await
}

#[cfg(target_os = "macos")]
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
