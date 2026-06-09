use tokio::sync::Mutex;

use super::{project::SharedProjectManager, window::SharedWindowRegistry};
use crate::{app::KazmasResult, world::WorldProject};

#[derive(Default)]
pub(crate) struct AppState {
    #[deprecated]
    project: Mutex<Option<WorldProject>>,

    registry: SharedWindowRegistry,
    manager: SharedProjectManager,
}

impl AppState {
    pub(crate) async fn replace_project(&self, new_project: WorldProject) -> KazmasResult<()> {
        let old_project = {
            let mut project = self.project.lock().await;
            project.replace(new_project)
        };

        if let Some(old_project) = old_project {
            old_project.close_world().await?;
        }

        Ok(())
    }

    pub(crate) async fn save_project(&self) -> KazmasResult<()> {
        let mut project = self.project.lock().await;
        if let Some(project) = project.as_mut() {
            project.save_world().await?;
        }

        Ok(())
    }

    pub(crate) async fn close_project(&self) -> KazmasResult<()> {
        let project = self.project.lock().await.take();
        if let Some(project) = project {
            project.close_world().await?;
        }

        Ok(())
    }
}
