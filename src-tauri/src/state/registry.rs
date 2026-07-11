use std::collections::HashMap;

use tokio::sync::Mutex;
use uuid::Uuid;

use crate::app::{KazmasError, KazmasResult};

type WindowId = Uuid;
type ProjectId = Uuid;

#[derive(Default)]
struct WindowRegistryInner {
    by_windows: HashMap<WindowId, Option<ProjectId>>,
    by_projects: HashMap<ProjectId, WindowId>,
    focused_window: Option<WindowId>,
}

#[derive(Default)]
pub(crate) struct WindowRegistry {
    inner: Mutex<WindowRegistryInner>,
}

impl WindowRegistry {
    pub(crate) async fn get_project_id(&self, window_id: WindowId) -> Option<ProjectId> {
        let inner = self.inner.lock().await;
        inner.by_windows.get(&window_id).copied().flatten()
    }

    pub(crate) async fn get_window_id(&self, project_id: ProjectId) -> Option<WindowId> {
        let inner = self.inner.lock().await;
        inner.by_projects.get(&project_id).copied()
    }

    pub(crate) async fn focused_window(&self) -> Option<WindowId> {
        let inner = self.inner.lock().await;
        inner.focused_window
    }

    pub(crate) async fn set_focus(&self, window_id: Option<WindowId>) {
        let mut inner = self.inner.lock().await;
        inner.focused_window = window_id;
    }

    pub(crate) async fn register_window(
        &self,
        window_id: WindowId,
        project_id: Option<ProjectId>,
    ) -> KazmasResult<()> {
        let mut inner = self.inner.lock().await;
        if inner.by_windows.contains_key(&window_id) {
            return Err(KazmasError::AlreadyExists(format!(
                "window {window_id} is already registered"
            )));
        }

        if let Some(project_id) = project_id {
            if let Some(opened_window_id) = inner.by_projects.get(&project_id) {
                return Err(KazmasError::AlreadyExists(format!(
                    "world {project_id} is already opened in window {opened_window_id}"
                )));
            }
            inner.by_projects.insert(project_id, window_id);
        }

        inner.by_windows.insert(window_id, project_id);
        Ok(())
    }

    pub(crate) async fn unregister_window(&self, window_id: WindowId) -> Option<ProjectId> {
        let mut inner = self.inner.lock().await;

        let project_id = inner.by_windows.remove(&window_id).flatten();
        if let Some(project_id) = project_id {
            inner.by_projects.remove(&project_id);
        }

        project_id
    }

    pub(crate) async fn replace_project(
        &self,
        window_id: WindowId,
        project_id: ProjectId,
    ) -> KazmasResult<Option<ProjectId>> {
        let mut inner = self.inner.lock().await;

        if let Some(opened_window_id) = inner.by_projects.get(&project_id)
            && *opened_window_id != window_id
        {
            return Err(KazmasError::AlreadyExists(format!(
                "world {project_id} is already opened in window {opened_window_id}"
            )));
        }

        let prev_project_id = inner
            .by_windows
            .get_mut(&window_id)
            .ok_or_else(|| KazmasError::NotFound(format!("window {window_id} is not registered")))?
            .replace(project_id);

        if let Some(prev_project_id) = prev_project_id {
            inner.by_projects.remove(&prev_project_id);
        }
        inner.by_projects.insert(project_id, window_id);

        Ok(prev_project_id)
    }

    pub(crate) async fn close_project(&self, window_id: WindowId) -> Option<ProjectId> {
        let mut inner = self.inner.lock().await;

        let project_id = inner.by_windows.get_mut(&window_id).and_then(Option::take);
        if let Some(project_id) = project_id {
            inner.by_projects.remove(&project_id);
        }

        project_id
    }
}
