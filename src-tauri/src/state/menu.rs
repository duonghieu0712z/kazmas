use tauri::{AppHandle, async_runtime::spawn};
#[cfg(target_os = "macos")]
use tauri::{Wry, menu::Menu};
use tokio::sync::{
    Mutex,
    watch::{Receiver, Sender},
};

use crate::{
    app::{KazmasError, KazmasResult},
    menu::{self, MenuSection},
};

#[derive(Default)]
pub(crate) struct MenuManager {
    menu_sections: Mutex<Vec<MenuSection>>,
    menu_sections_tx: Sender<Vec<MenuSection>>,

    #[cfg(target_os = "macos")]
    menu: Option<Menu<Wry>>,
}

impl MenuManager {
    pub(crate) async fn init(&self, app: &AppHandle) -> KazmasResult<()> {
        self.update_menu(|menu_sections| {
            *menu_sections = menu::menu_sections(&app.package_info().name);
        })
        .await
    }

    pub(crate) async fn menu_sections(&self) -> Vec<MenuSection> {
        self.menu_sections.lock().await.clone()
    }

    pub(crate) async fn update_menu<F>(&self, f: F) -> KazmasResult<()>
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

    pub(crate) fn watch(&self) {
        let mut rx = self.subscribe();
        spawn(async move {
            while rx.changed().await.is_ok() {
                let snapshot = rx.borrow();
                log::debug!("Menu snapshot: {snapshot:#?}");
            }
        });
    }

    fn subscribe(&self) -> Receiver<Vec<MenuSection>> {
        self.menu_sections_tx.subscribe()
    }
}
