use tauri::{AppHandle, async_runtime::spawn};
#[cfg(target_os = "macos")]
use tauri::{
    Wry,
    menu::{Menu, MenuItemKind},
};
use tokio::sync::{
    Mutex,
    watch::{Receiver, Sender},
};

#[cfg(target_os = "macos")]
use super::get_state;
#[cfg(target_os = "macos")]
use crate::menu::{build_menu, handle_menu_event};
use crate::{
    app::{KazmasError, KazmasResult},
    menu::{self, MenuCommand, MenuSection},
};

#[derive(Default)]
pub(crate) struct MenuManager {
    menu_sections: Mutex<Vec<MenuSection>>,
    menu_sections_tx: Sender<Vec<MenuSection>>,

    #[cfg(target_os = "macos")]
    menu: Mutex<Option<Menu<Wry>>>,
}

impl MenuManager {
    pub(crate) async fn menu_sections(&self) -> Vec<MenuSection> {
        self.menu_sections.lock().await.clone()
    }

    pub(crate) async fn init(&self, app: &AppHandle) -> KazmasResult<()> {
        self.watch();

        self.update_menu(|menu_sections| {
            *menu_sections = menu::menu_sections(&app.package_info().name);
        })
        .await?;

        #[cfg(target_os = "macos")]
        self.build_menu(app).await?;

        Ok(())
    }

    #[cfg(target_os = "macos")]
    async fn build_menu(&self, app: &AppHandle) -> KazmasResult<()> {
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

        let menu_sections = self.menu_sections().await;
        let menu = build_menu(app, menu_sections)?;
        if let Some(item) = menu.get("menu:about") {
            log::error!("menu item: {:?}", item.id());
        }

        *self.menu.lock().await = Some(menu);
        Ok(())
    }

    pub(crate) async fn set_command_enabled(
        &self,
        command: MenuCommand,
        enabled: bool,
    ) -> KazmasResult<()> {
        self.update_menu(|menu_sections| {
            menu::set_command_enabled(menu_sections, command, enabled);
        })
        .await?;

        #[cfg(target_os = "macos")]
        self.set_native_command_enabled(command, enabled).await?;

        Ok(())
    }

    async fn update_menu<F>(&self, f: F) -> KazmasResult<()>
    where
        F: FnOnce(&mut Vec<MenuSection>),
    {
        let next = {
            let mut menu_sections = self.menu_sections.lock().await;
            f(&mut menu_sections);
            menu_sections.clone()
        };

        self.menu_sections_tx.send(next).map_err(|error| {
            KazmasError::Invalid(format!("failed to publish menu state: {error}"))
        })?;
        Ok(())
    }

    fn watch(&self) {
        let mut rx = self.subscribe();
        spawn(async move {
            while rx.changed().await.is_ok() {
                let snapshot = rx.borrow();
                if snapshot.has_changed() {
                    log::debug!("Menu snapshot: {:#?}", snapshot);
                }
            }
        });
    }

    fn subscribe(&self) -> Receiver<Vec<MenuSection>> {
        self.menu_sections_tx.subscribe()
    }

    #[cfg(target_os = "macos")]
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

#[cfg(target_os = "macos")]
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
