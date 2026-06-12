use std::sync::Arc;

use super::{project::ProjectManager, window::WindowRegistry};

#[derive(Default)]
pub(crate) struct AppState {
    registry: Arc<WindowRegistry>,
    manager: Arc<ProjectManager>,
}

impl AppState {
    pub(crate) fn registry(&self) -> &Arc<WindowRegistry> {
        &self.registry
    }

    pub(crate) fn manager(&self) -> &Arc<ProjectManager> {
        &self.manager
    }
}
