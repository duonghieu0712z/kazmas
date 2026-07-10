use std::collections::HashMap;

use tauri::{AppHandle, Wry, async_runtime::spawn, menu::MenuItemKind};
use tokio::sync::Mutex;

use super::get_state;
use crate::{
    app::KazmasResult,
    menu::{MenuCommand, build_menu, handle_menu_event},
};

#[derive(Default)]
pub(crate) struct MenuManager {
    items: Mutex<HashMap<MenuCommand, MenuItemKind<Wry>>>,
}

impl MenuManager {
    pub(crate) async fn init(&self, app: &AppHandle) -> KazmasResult<()> {
        app.on_menu_event(|app, event| {
            let app = app.clone();
            let event = event.clone();
            spawn(async move {
                let window_id = get_state(&app).registry().focused_window().await;
                if let Err(error) = handle_menu_event(&app, event, window_id).await {
                    log::error!("{error}");
                }
            });
        });

        {
            let mut items = self.items.lock().await;
            build_menu(app, &mut items)?;
        }

        self.set_project_commands_enabled(false).await?;
        self.set_recent_world_commands_enabled(false).await?;

        Ok(())
    }

    pub(crate) async fn set_project_commands_enabled(&self, enabled: bool) -> KazmasResult<()> {
        for command in [
            MenuCommand::Save,
            MenuCommand::SaveAs,
            MenuCommand::CloseWorld,
            MenuCommand::NewFile,
            MenuCommand::NewFolder,
            MenuCommand::ProjectSettings,
            MenuCommand::EmptyTrash,
        ] {
            self.set_native_command_enabled(command, enabled).await?;
        }

        Ok(())
    }

    pub(crate) async fn set_recent_world_commands_enabled(
        &self,
        enabled: bool,
    ) -> KazmasResult<()> {
        self.set_native_command_enabled(MenuCommand::ClearWorlds, enabled)
            .await
    }

    async fn set_native_command_enabled(
        &self,
        command: MenuCommand,
        enabled: bool,
    ) -> KazmasResult<()> {
        if let Some(item) = self.items.lock().await.get(&command) {
            set_native_item_enabled(item, enabled)?;
        }

        Ok(())
    }
}

fn set_native_item_enabled(item: &MenuItemKind<Wry>, enabled: bool) -> KazmasResult<()> {
    match item {
        MenuItemKind::MenuItem(item) => item.set_enabled(enabled)?,
        MenuItemKind::Submenu(item) => item.set_enabled(enabled)?,
        MenuItemKind::Check(item) => item.set_enabled(enabled)?,
        MenuItemKind::Icon(item) => item.set_enabled(enabled)?,
        MenuItemKind::Predefined(_) => {}
    }
    Ok(())
}
