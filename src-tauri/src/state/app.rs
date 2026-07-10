use std::sync::Arc;

use tauri::{Manager, Runtime, State};

#[cfg(target_os = "macos")]
use super::menu::MenuManager;
use super::{project::ProjectManager, registry::WindowRegistry};

#[derive(Default)]
pub(crate) struct AppState {
    registry: Arc<WindowRegistry>,
    project_manager: Arc<ProjectManager>,
    #[cfg(target_os = "macos")]
    menu_manager: Arc<MenuManager>,
}

impl AppState {
    pub(crate) fn registry(&self) -> &Arc<WindowRegistry> {
        &self.registry
    }

    pub(crate) fn project_manager(&self) -> &Arc<ProjectManager> {
        &self.project_manager
    }

    #[cfg(target_os = "macos")]
    pub(crate) fn menu_manager(&self) -> &Arc<MenuManager> {
        &self.menu_manager
    }
}

pub(crate) fn get_state<R: Runtime, M: Manager<R>>(manager: &M) -> State<'_, AppState> {
    manager.state::<AppState>()
}
