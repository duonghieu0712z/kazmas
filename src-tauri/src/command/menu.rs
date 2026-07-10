use tauri::{AppHandle, WebviewWindow};

use super::error::CommandResult;
use crate::{
    menu::{MenuCommand, handle_command},
    utils::parse_window_label,
};

#[tauri::command]
#[specta::specta]
pub(super) async fn execute_menu_command(
    app: AppHandle,
    window: WebviewWindow,
    id: MenuCommand,
) -> CommandResult<()> {
    let window_id = parse_window_label(window.label())?;
    handle_command(&app, id, window_id).await?;
    Ok(())
}
