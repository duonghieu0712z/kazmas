use tauri::AppHandle;

use super::error::CommandResult;
use crate::menu::{MenuCommand, MenuGroup, app_menu, execute_command};

#[tauri::command]
#[specta::specta]
pub(super) fn get_app_menu(app: AppHandle) -> Vec<MenuGroup> {
    app_menu(&app)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn execute_menu_command(app: AppHandle, id: MenuCommand) -> CommandResult<()> {
    execute_command(&app, id).await?;
    Ok(())
}
