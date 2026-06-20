#[cfg(target_os = "macos")]
mod builder;
mod command;
mod descriptor;
mod handler;

#[cfg(target_os = "macos")]
pub(crate) use builder::build_menu;
pub(crate) use command::MenuCommand;
pub(crate) use descriptor::{MenuSection, menu_sections};
#[cfg(target_os = "macos")]
pub(crate) use handler::handle_menu_event;
use tauri::{AppHandle, Manager};

use crate::app::KazmasResult;

pub(crate) async fn execute_command(app: &AppHandle, command: MenuCommand) -> KazmasResult<()> {
    let window_id = app
        .state::<crate::state::AppState>()
        .registry()
        .focused_window()
        .await;

    handler::handle_command(app, command, window_id).await
}
