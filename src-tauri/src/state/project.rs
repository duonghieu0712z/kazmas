use std::collections::HashMap;

use tokio::sync::Mutex;
use uuid::Uuid;

use crate::{
    app::KazmasResult,
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

    pub(crate) async fn open_project(&self, project: WorldProject) -> KazmasResult<()> {
        let mut projects = self.projects.lock().await;
        projects.insert(project.manifest().id, project);
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
