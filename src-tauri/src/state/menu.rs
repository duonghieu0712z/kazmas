use tauri::{AppHandle, async_runtime::spawn};
#[cfg(target_os = "macos")]
use tauri::{Manager, Wry, menu::Menu};
use tokio::sync::{
    Mutex,
    watch::{Receiver, Sender},
};

#[cfg(target_os = "macos")]
use crate::menu::{build_menu, handle_menu_event};
use crate::{
    app::{KazmasError, KazmasResult},
    menu::{self, MenuSection},
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
        let menu_sections = self.menu_sections().await;
        let menu = build_menu(app, menu_sections)?;
        app.on_menu_event(|app, event| {
            let app = app.clone();
            let event = event.clone();
            spawn(async move {
                let window_id = app
                    .state::<crate::state::AppState>()
                    .registry()
                    .focused_window()
                    .await;
                if let Err(error) = handle_menu_event(&app, event, window_id).await {
                    log::error!("{error}");
                }
            });
        });

        *self.menu.lock().await = Some(menu);
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
}
