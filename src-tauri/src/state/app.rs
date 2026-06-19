use std::sync::Arc;

use super::{menu::MenuManager, project::ProjectManager, window::WindowRegistry};

#[derive(Default)]
pub(crate) struct AppState {
    registry: Arc<WindowRegistry>,
    menu_manager: Arc<MenuManager>,
    project_manager: Arc<ProjectManager>,
}

impl AppState {
    pub(crate) fn registry(&self) -> &Arc<WindowRegistry> {
        &self.registry
    }

    pub(crate) fn menu_manager(&self) -> &Arc<MenuManager> {
        &self.menu_manager
    }

    pub(crate) fn project_manager(&self) -> &Arc<ProjectManager> {
        &self.project_manager
    }
}
