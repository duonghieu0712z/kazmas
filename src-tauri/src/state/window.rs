use std::collections::HashMap;

use tauri::{
    AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
    async_runtime::spawn,
};
use tokio::sync::Mutex;
use uuid::Uuid;

use super::app::AppState;
use crate::app::{KazmasError, KazmasResult};

const LABEL_PREFIX: &str = "kazmas-window:";

pub(crate) fn window_label(id: &Uuid) -> String {
    format!("{LABEL_PREFIX}{id}")
}

pub(crate) fn parse_window_label(label: &str) -> KazmasResult<Option<Uuid>> {
    let id = label
        .strip_prefix(LABEL_PREFIX)
        .map(Uuid::parse_str)
        .transpose()?;
    Ok(id)
}

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
    pub(crate) async fn get_project_id(&self, window_id: &WindowId) -> Option<ProjectId> {
        let inner = self.inner.lock().await;
        inner.by_windows.get(window_id).copied().flatten()
    }

    pub(crate) async fn get_window_id(&self, project_id: &ProjectId) -> Option<WindowId> {
        let inner = self.inner.lock().await;
        inner.by_projects.get(project_id).copied()
    }

    pub(crate) async fn focused_window(&self) -> Option<WindowId> {
        let inner = self.inner.lock().await;
        inner.focused_window
    }

    pub(crate) async fn set_focus(&self, window_id: Option<&WindowId>) {
        let mut inner = self.inner.lock().await;
        inner.focused_window = window_id.copied();
    }

    pub(crate) async fn register_window(
        &self,
        window_id: &WindowId,
        project_id: Option<&ProjectId>,
    ) -> KazmasResult<()> {
        let mut inner = self.inner.lock().await;
        if inner.by_windows.contains_key(window_id) {
            return Err(KazmasError::AlreadyExists(format!(
                "window {window_id} is already registered"
            )));
        }

        if let Some(project_id) = project_id {
            if inner.by_projects.contains_key(project_id) {
                return Err(KazmasError::AlreadyExists(format!(
                    "world {project_id} is already opened in window {window_id}"
                )));
            }
            inner.by_projects.insert(*project_id, *window_id);
        }

        inner.by_windows.insert(*window_id, project_id.copied());
        Ok(())
    }

    pub(crate) async fn unregister_window(&self, window_id: &WindowId) -> Option<ProjectId> {
        let mut inner = self.inner.lock().await;

        let project_id = inner.by_windows.remove(window_id).flatten();

        if let Some(project_id) = project_id {
            inner.by_projects.remove(&project_id);
        }

        project_id
    }

    pub(crate) async fn replace_project(
        &self,
        window_id: &WindowId,
        project_id: &ProjectId,
    ) -> KazmasResult<Option<ProjectId>> {
        let mut inner = self.inner.lock().await;

        if let Some(opened_window_id) = inner.by_projects.get(project_id)
            && opened_window_id != window_id
        {
            return Err(KazmasError::AlreadyExists(format!(
                "world {project_id} is already opened in window {opened_window_id}"
            )));
        }

        let old_project_id = inner
            .by_windows
            .get_mut(window_id)
            .ok_or_else(|| KazmasError::NotFound(format!("window {window_id} is not registered")))?
            .replace(*project_id);

        if let Some(previous_project_id) = old_project_id {
            inner.by_projects.remove(&previous_project_id);
        }
        inner.by_projects.insert(*project_id, *window_id);

        Ok(old_project_id)
    }

    pub(crate) async fn close_project(&self, window_id: &WindowId) -> Option<ProjectId> {
        let mut inner = self.inner.lock().await;

        let project_id = inner.by_windows.get_mut(window_id).and_then(Option::take);

        if let Some(project_id) = project_id {
            inner.by_projects.remove(&project_id);
        }

        project_id
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
                state.registry().set_focus(Some(&window_id)).await;
            } else if Some(window_id) == state.registry().focused_window().await {
                state.registry().set_focus(None).await;
            }
        }
        WindowEvent::Destroyed => {
            if let Some(project_id) = state.registry().unregister_window(&window_id).await {
                state.manager().close_project(&project_id).await?;
            }
        }
        _ => log::debug!("Window unhandled event {event:?}"),
    }
    Ok(())
}
