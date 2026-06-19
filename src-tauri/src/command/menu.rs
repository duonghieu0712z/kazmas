use tauri::{AppHandle, State};

use super::error::CommandResult;
use crate::{
    menu::{MenuCommand, MenuSection, execute_command},
    state::AppState,
};

#[tauri::command]
#[specta::specta]
pub(super) async fn get_app_menu(state: State<'_, AppState>) -> CommandResult<Vec<MenuSection>> {
    let menu_sections = state.menu_manager().menu_sections().await;
    Ok(menu_sections)
}

#[tauri::command]
#[specta::specta]
pub(super) async fn execute_menu_command(app: AppHandle, id: MenuCommand) -> CommandResult<()> {
    execute_command(&app, id).await?;
    Ok(())
}
