use tauri::{
    AppHandle, Wry,
    async_runtime::spawn,
    menu::{Menu, MenuItemKind},
};
use tokio::sync::Mutex;

use super::get_state;
use crate::{
    app::KazmasResult,
    menu::{MenuCommand, build_menu, handle_menu_event},
};

#[derive(Default)]
pub(crate) struct MenuManager {
    menu: Mutex<Option<Menu<Wry>>>,
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

        let menu = build_menu(app)?;
        *self.menu.lock().await = Some(menu);
        Ok(())
    }

    pub(crate) async fn set_project_commands_enabled(&self, enabled: bool) -> KazmasResult<()> {
        for command in [
            MenuCommand::NewFile,
            MenuCommand::NewFolder,
            MenuCommand::ProjectSettings,
            MenuCommand::EmptyTrash,
        ] {
            self.set_native_command_enabled(command, enabled).await?;
        }

        Ok(())
    }

    async fn set_native_command_enabled(
        &self,
        command: MenuCommand,
        enabled: bool,
    ) -> KazmasResult<()> {
        let Some(menu) = self.menu.lock().await.clone() else {
            return Ok(());
        };

        for item in menu.items()? {
            set_native_item_enabled(&item, command, enabled)?;
        }

        Ok(())
    }
}

fn set_native_item_enabled(
    item: &MenuItemKind<Wry>,
    command: MenuCommand,
    enabled: bool,
) -> KazmasResult<()> {
    if item.id().as_ref() == command.as_ref() {
        match item {
            MenuItemKind::MenuItem(item) => item.set_enabled(enabled)?,
            MenuItemKind::Submenu(item) => item.set_enabled(enabled)?,
            MenuItemKind::Check(item) => item.set_enabled(enabled)?,
            MenuItemKind::Icon(item) => item.set_enabled(enabled)?,
            MenuItemKind::Predefined(_) => {}
        }
    }

    if let MenuItemKind::Submenu(submenu) = item {
        for item in submenu.items()? {
            set_native_item_enabled(&item, command, enabled)?;
        }
    }

    Ok(())
}
