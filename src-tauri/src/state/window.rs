use std::collections::HashMap;

use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
    async_runtime::spawn, window,
};
use tokio::sync::Mutex;
use uuid::Uuid;

use super::AppState;
use crate::app::{KazmasError, KazmasResult};

const LABEL_PREFIX: &str = "kazmas-window:";

fn window_label(id: &Uuid) -> String {
    format!("{LABEL_PREFIX}{id}")
}

fn parse_window_label(label: &str) -> KazmasResult<Option<Uuid>> {
    let id = label
        .strip_prefix(LABEL_PREFIX)
        .map(|id| Uuid::parse_str(id))
        .transpose()?;
    Ok(id)
}

#[derive(Default)]
struct WindowRegistryInner {
    sessions: HashMap<Uuid, WindowSession>,
    project_windows: HashMap<Uuid, Uuid>,
    last_window: Option<Uuid>,
}

#[derive(Debug, Clone, Copy)]
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

    pub(crate) async fn unregister_window(&self, window_id: &Uuid) -> KazmasResult<Option<Uuid>> {
        let mut inner = self.inner.lock().await;

        let project_id = inner
            .sessions
            .remove(window_id)
            .and_then(|session| session.project_id);

        if let Some(project_id) = project_id {
            inner.project_windows.remove(&project_id);
        }

        if inner.last_window == Some(*window_id) {
            inner.last_window = None;
        }

        Ok(project_id)
    }

    pub(crate) async fn replace_project(
        &self,
        window_id: &Uuid,
        project_id: &Uuid,
    ) -> KazmasResult<Option<Uuid>> {
        let mut inner = self.inner.lock().await;

        if let Some(opened_window_id) = inner.project_windows.get(project_id) {
            if opened_window_id != window_id {
                return Err(KazmasError::AlreadyExists(format!(
                    "project {project_id} is already opened in window {opened_window_id}"
                )));
            }
        }

        let previous_project_id = inner
            .sessions
            .get_mut(window_id)
            .ok_or_else(|| KazmasError::NotFound(format!("window {window_id} is not registered")))?
            .project_id
            .replace(*project_id);

        if let Some(previous_project_id) = previous_project_id {
            inner.project_windows.remove(&previous_project_id);
        }
        inner.project_windows.insert(*project_id, *window_id);

        Ok(previous_project_id)
    }

    pub(crate) async fn close_project(&self, window_id: &Uuid) -> KazmasResult<Option<Uuid>> {
        let mut inner = self.inner.lock().await;

        let project_id = inner
            .sessions
            .get_mut(window_id)
            .and_then(|session| session.project_id.take());

        if let Some(project_id) = project_id {
            inner.project_windows.remove(&project_id);
        }

        Ok(project_id)
    }

    pub(crate) async fn get_last_window(&self) -> Option<Uuid> {
        let inner = self.inner.lock().await;
        inner.last_window
    }

    pub(crate) async fn set_last_window(&self, window_id: Option<&Uuid>) -> KazmasResult<()> {
        let Some(window_id) = window_id else {
            self.inner.lock().await.last_window = None;
            return Ok(());
        };

        let mut inner = self.inner.lock().await;
        if !inner.sessions.contains_key(window_id) {
            return Err(KazmasError::NotFound(format!(
                "window {window_id} is not registered"
            )));
        }

        inner.last_window = Some(*window_id);
        Ok(())
    }

    pub(crate) async fn get_session(&self, window_id: &Uuid) -> Option<WindowSession> {
        let inner = self.inner.lock().await;
        inner.sessions.get(window_id).copied()
    }

    pub(crate) async fn get_session_by_label(
        &self,
        label: &str,
    ) -> KazmasResult<Option<WindowSession>> {
        if let Some(id) = parse_window_label(label)? {
            Ok(self.get_session(&id).await)
        } else {
            Ok(None)
        }
    }

    pub(crate) async fn get_window_id_by_project(&self, project_id: &Uuid) -> Option<Uuid> {
        let inner = self.inner.lock().await;
        inner.project_windows.get(project_id).copied()
    }
}

pub(crate) async fn spawn_window(app: &AppHandle, project_id: Option<&Uuid>) -> KazmasResult<()> {
    let window_id = Uuid::now_v7();
    let label = window_label(&window_id);

    let state = app.state::<AppState>();
    state
        .registry()
        .register_window(&window_id, project_id)
        .await?;

    let window = WebviewWindowBuilder::new(app, &label, WebviewUrl::App("index.html".into()))
        .title("New World")
        .inner_size(1200.0, 800.0)
        .center()
        .build()?;

    if let Some(project_id) = project_id {
        if let Some(manifest) = state.manager().world_manifest(project_id).await? {
            window.set_title(&manifest.name)?;
        }
    }

    let event_window = window.clone();
    window.on_window_event(move |event| {
        let window = event_window.clone();
        let event = event.clone();

        spawn(async move {
            if let Err(error) = handle_window_event(&window, &event).await {
                log::error!("{error}");
            }
        });
    });

    window.show()?;
    window.set_focus()?;

    Ok(())
}

async fn handle_window_event(window: &WebviewWindow, event: &WindowEvent) -> KazmasResult<()> {
    let state = window.state::<AppState>();
    let Some(window_id) = parse_window_label(window.label())? else {
        return Ok(());
    };

    match event {
        WindowEvent::Focused(flag) => {
            if *flag {
                state.registry().set_last_window(Some(&window_id)).await?;
            } else if Some(window_id) == state.registry().get_last_window().await {
                state.registry().set_last_window(None).await?;
            }
        }
        WindowEvent::Destroyed => {
            if let Some(project_id) = state.registry().unregister_window(&window_id).await? {
                state.manager().close_project(&project_id).await?;
            }
        }
        _ => log::debug!("Window unhandled event {event:?}"),
    }
    Ok(())
}
