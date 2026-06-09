use std::collections::HashMap;

use tokio::sync::Mutex;
use uuid::Uuid;

use crate::app::{KazmasError, KazmasResult};

#[derive(Default)]
struct WindowRegistryInner {
    sessions: HashMap<Uuid, WindowSession>,
    project_windows: HashMap<Uuid, Uuid>,
    last_window: Option<Uuid>,
}

struct WindowSession {
    window_id: Uuid,
    project_id: Option<Uuid>,
}

#[derive(Default)]
pub(crate) struct WindowRegistry {
    inner: Mutex<WindowRegistryInner>,
}

impl WindowRegistry {
    pub(crate) async fn register_window(
        &self,
        window_id: &Uuid,
        project_id: Option<&Uuid>,
    ) -> KazmasResult<()> {
        let mut inner = self.inner.lock().await;
        if inner.sessions.contains_key(window_id) {
            return Err(KazmasError::AlreadyExists(format!(
                "window {window_id} is already registered"
            )));
        }

        if let Some(project_id) = project_id {
            if inner.project_windows.contains_key(project_id) {
                return Err(KazmasError::AlreadyExists(format!(
                    "project {project_id} is already opened in window {window_id}"
                )));
            }
            inner.project_windows.insert(*project_id, *window_id);
        }

        inner.sessions.insert(*window_id, WindowSession {
            window_id: *window_id,
            project_id: project_id.copied(),
        });

        Ok(())
    }

    pub(crate) async fn unregister_window(&self, window_id: &Uuid) -> KazmasResult<()> {
        let mut inner = self.inner.lock().await;

        if let Some(session) = inner.sessions.remove(window_id) {
            if let Some(project_id) = session.project_id {
                inner.project_windows.remove(&project_id);
            }
        }

        if inner.last_window == Some(*window_id) {
            inner.last_window = None;
        }

        Ok(())
    }
}
