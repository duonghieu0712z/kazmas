use tauri::AppHandle;

use super::error::CommandResult;

#[tauri::command]
#[specta::specta]
pub(super) fn get_app_menu() -> Vec<crate::menu::MenuGroup> {
    crate::menu::app_menu()
}

#[tauri::command]
#[specta::specta]
pub(super) async fn execute_menu_command(
    app: AppHandle,
    id: crate::menu::MenuCommand,
) -> CommandResult<()> {
    crate::menu::execute_command(&app, id).await?;
    Ok(())
}
