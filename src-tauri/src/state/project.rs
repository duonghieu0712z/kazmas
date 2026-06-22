use std::{collections::HashMap, future::Future};

use tokio::sync::Mutex;
use uuid::Uuid;

use crate::{
    app::{KazmasError, KazmasResult},
    world::{WorldManifest, WorldProject},
};

#[derive(Default)]
pub(crate) struct ProjectManager {
    projects: Mutex<HashMap<Uuid, WorldProject>>,
}

impl ProjectManager {
    pub(crate) async fn world_manifest(&self, id: &Uuid) -> KazmasResult<Option<WorldManifest>> {
        let projects = self.projects.lock().await;
        let project = projects.get(id);
        let manifest = project.map(|p| p.manifest());
        Ok(manifest)
    }

    pub(crate) async fn open_project_or_close<T>(
        &self,
        project: WorldProject,
        action: impl Future<Output = KazmasResult<T>>,
    ) -> KazmasResult<T> {
        let project_id = project.manifest().id;
        self.open_project(project).await?;

        let result = action.await;
        if let Err(error) = result {
            if let Err(cleanup_error) = self.close_project(&project_id).await {
                return Err(KazmasError::Invalid(format!(
                    "{error}; cleanup failed: {cleanup_error}"
                )));
            }
            return Err(error);
        }
        result
    }

    async fn open_project(&self, project: WorldProject) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        let project_id = project.manifest().id;
        if projects.contains_key(&project_id) {
            return Err(KazmasError::AlreadyExists(format!(
                "project {project_id} is already open"
            )));
        }

        projects.insert(project_id, project);
        Ok(())
    }

    pub(crate) async fn save_project(&self, id: &Uuid) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.get_mut(id) {
            project.save_world().await?;
        }

        Ok(())
    }

    pub(crate) async fn close_project(&self, id: &Uuid) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        if let Some(project) = projects.remove(id) {
            project.close_world().await?;
        }

        Ok(())
    }
}
