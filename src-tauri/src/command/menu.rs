use tauri::{AppHandle, State, WebviewWindow};

use super::error::CommandResult;
use crate::{
    menu::{MenuCommand, MenuSection, handle_command},
    state::AppState,
    utils::parse_window_label,
};

#[tauri::command]
#[specta::specta]
pub(super) async fn get_app_menu(state: State<'_, AppState>) -> CommandResult<Vec<MenuSection>> {
    let menu_sections = state.menu_manager().menu_sections().await;
    Ok(menu_sections)
}

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
