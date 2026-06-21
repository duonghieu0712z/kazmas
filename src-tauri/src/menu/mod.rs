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
use tauri::AppHandle;

use crate::{app::KazmasResult, state::get_state};

pub(crate) async fn execute_command(app: &AppHandle, command: MenuCommand) -> KazmasResult<()> {
    let window_id = get_state(app).registry().focused_window().await;
    handler::handle_command(app, command, window_id).await
}
